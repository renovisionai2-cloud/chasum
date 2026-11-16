"""Trusted Ubuntu driver. Acquisition never executes candidate lifecycle code.

Candidate execution occurs only in the network-none, unprivileged container.
No GitHub, npm, cloud or artifact credentials are mounted or forwarded into it.
"""
import argparse
import hashlib
import http.server
import json
import os
import pathlib
import platform
import re
import shutil
import socket
import subprocess
import threading
import time
import urllib.request

from assess import source
from fonts import stage

ROOT = pathlib.Path(__file__).resolve().parent
C = json.loads((ROOT / 'contract.json').read_text())
ENV = {
    'PATH': '/node/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
    'HOME': '/home/pwuser', 'TMPDIR': '/tmp', 'LANG': 'C.UTF-8', 'CI': 'true',
    'NEXT_TELEMETRY_DISABLED': '1', 'PLAYWRIGHT_BROWSERS_PATH': '/ms-playwright',
    'CHASUM_TAX_EVIDENCE': '/out/screenshots',
}


def command(args, cwd=None, env=None, timeout=120, log=None):
    if log:
        with log.open('w') as stream:
            return subprocess.run(args, cwd=cwd, env=env, stdout=stream,
                                  stderr=subprocess.STDOUT, timeout=timeout, check=True)
    return subprocess.check_output(args, cwd=cwd, env=env, timeout=timeout, text=True).strip()


def identity(candidate):
    def git(*args): return command(['git', *args], cwd=candidate)
    assert git('rev-list', '--parents', '-n1', 'HEAD').split() == [C['sha'], C['parent']]
    assert git('rev-parse', 'HEAD^{tree}') == C['tree']
    assert not git('status', '--porcelain', '--untracked-files=all'), 'Candidate checkout is dirty'
    source(candidate, C['source_sha256'])
    files = git('ls-files', '-z').split('\0')
    assert set(filter(None, files)) == set(C['source_sha256'])
    for name in files:
        if not name: continue
        assert not (candidate / name).is_symlink(), 'Unexpected source symlink'
        assert pathlib.Path(name).name not in ('.env', '.env.local', '.env.production', '.env.production.local', '.npmrc')
    return {'sha': C['sha'], 'parent': C['parent'], 'tree': C['tree'], 'clean': True}


def verify_controls(verification, controls_manifest=None, manifest_sha=None):
    """Explicit trust source; execution mode never selects or downgrades it."""
    assert verification in ('hosted', 'local'), 'Explicit controls verification required'
    if verification == 'hosted':
        assert controls_manifest is None and manifest_sha is None, 'Hosted controls cannot use a local manifest'
        expected = os.environ.get('CONTROL_SHA', '')
        assert re.fullmatch('[0-9a-f]{40}', expected), 'Missing or invalid CONTROL_SHA'
        actual = command(['git', 'rev-parse', 'HEAD'], cwd=ROOT)
        assert actual == expected, 'Controls HEAD does not match CONTROL_SHA'
        assert not command(['git', 'status', '--porcelain', '--untracked-files=all'], cwd=ROOT), 'Dirty controls checkout'
        return {'verification': 'hosted-git', 'sha': actual, 'clean': True}
    assert os.environ.get('GITHUB_ACTIONS') != 'true', 'Hosted execution cannot select local verification'
    assert controls_manifest and re.fullmatch('[0-9a-f]{64}', manifest_sha or ''), 'Local manifest and expected hash required'
    data = controls_manifest.read_bytes()
    assert hashlib.sha256(data).hexdigest() == manifest_sha, 'Local manifest hash mismatch'
    source(ROOT.parent.parent, json.loads(data))
    return {'verification': 'local-manifest', 'sha': 'local-draft-manifest-sha256:' + manifest_sha,
            'manifest_sha256': manifest_sha}


def assess_proof_execution(execution):
    stages = [json.loads(line) for line in (execution / 'stages.jsonl').read_text().splitlines()]
    required = ['offline-install', 'original-build-and-font-byte-validation']
    assert stages == [{'stage': s, 'status': 'PASS'} for s in required], 'Unexpected proof-only stages'
    for name in ('regression.json', 'regression.log', 'typecheck.log', 'assessment.json'):
        assert not (execution / name).exists(), 'Full-QA artifact forbidden during proof: ' + name
    assert json.loads((execution / 'proof-assessment.json').read_text()) == {
        'status': 'PASS', 'kind': 'bounded-proof-only', 'hosted_qa': 'NOT_RUN', 'regression': 'NOT_RERUN'
    }, 'Invalid proof-only assessment'
    return {'status': 'PASS', 'hosted_qa': 'NOT_RUN', 'kind': 'bounded-proof-only'}


class Receiver:
    """External-to-container controlled receiver with verified positive controls."""
    def __init__(self, ip):
        self.hits = []
        hits = self.hits

        class Handler(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                hits.append({'protocol': 'http', 'path': self.path})
                self.send_response(200); self.end_headers(); self.wfile.write(b'controlled receiver')
            def log_message(self, *args): pass

        self.http = http.server.HTTPServer((ip, 0), Handler)
        self.udp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.udp.bind((ip, 0)); self.udp.settimeout(.2)
        self.done = False
        def udp_run():
            while not self.done:
                try:
                    data, _ = self.udp.recvfrom(2048)
                    hits.append({'protocol': 'udp', 'bytes': len(data)})
                except socket.timeout: pass
                except OSError:
                    if not self.done: raise
        self.threads = [threading.Thread(target=self.http.serve_forever, daemon=True),
                        threading.Thread(target=udp_run, daemon=True)]
        for t in self.threads: t.start()
        self.config = {'ip': ip, 'http_port': self.http.server_port, 'udp_port': self.udp.getsockname()[1]}
        with urllib.request.build_opener(urllib.request.ProxyHandler({})).open(
                f'http://{ip}:{self.http.server_port}/positive-control', timeout=2) as response:
            assert response.status == 200
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sender:
            sender.sendto(b'positive-control', (ip, self.config['udp_port']))
        deadline = time.monotonic() + 2
        while len(hits) < 2 and time.monotonic() < deadline: time.sleep(.01)
        assert {h['protocol'] for h in hits} == {'http', 'udp'}
        self.positive = list(hits); hits.clear()

    def close(self):
        self.done = True; self.http.shutdown(); self.http.server_close(); self.udp.close()
        for t in self.threads: t.join(timeout=2)
        assert not any(t.is_alive() for t in self.threads)


def sanitize(raw, publish):
    """No untrusted stdout reaches Actions commands; no symlink artifact traversal."""
    size = 0
    for p in sorted(raw.rglob('*')):
        assert not p.is_symlink(), 'Artifact symlink forbidden'
        if not p.is_file(): continue
        assert p.suffix in ('.log', '.json', '.jsonl', '.txt', '.png'), f'Unexpected artifact: {p.name}'
        size += p.stat().st_size
        assert size < 128 * 1024 * 1024, 'Artifact size limit'
        target = publish / p.relative_to(raw); target.parent.mkdir(parents=True, exist_ok=True)
        if p.suffix == '.png':
            assert p.read_bytes().startswith(b'\x89PNG\r\n\x1a\n'); shutil.copyfile(p, target)
        else:
            text = p.read_text(errors='replace')
            text = re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', text)
            text = re.sub(r'(?i)(bearer\s+|(?:token|api_key|password|secret)=)[^\s&\"\']+', r'\1[REDACTED]', text)
            text = re.sub(r'(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)', '[REDACTED]', text)
            target.write_text(text)


def run(candidate, output, proof_only=None, controls_manifest=None, manifest_sha=None, controls_verification=None):
    assert proof_only is True, 'Explicit proof-only execution required'
    assert controls_verification in ('hosted', 'local'), 'Explicit controls verification required'
    output.mkdir(parents=True, exist_ok=False)
    raw, publish, inputs, execution = (output / p for p in ('raw', 'publish', 'inputs', 'execution'))
    for p in (raw, publish, inputs, execution): p.mkdir()
    execution.chmod(0o777)  # Candidate can write only this empty execution-evidence directory.
    receiver, container = None, None
    outcome = {'status': 'FAIL', 'stages': [], 'hosted_qa': 'NOT_RUN', 'kind': 'bounded-proof-only'}
    try:
        assert platform.system() == 'Linux' and platform.machine() == 'x86_64', 'Requires disposable Linux amd64'
        assert 'VERSION_ID="24.04"' in pathlib.Path('/etc/os-release').read_text()
        assert command(['node', '--version']) == 'v22.23.4'
        controls = verify_controls(controls_verification, controls_manifest, manifest_sha)
        before = identity(candidate)
        (raw / 'source-before.json').write_text(json.dumps(before, indent=2))
        (raw / 'controls.json').write_text(json.dumps({**controls, 'actions': C['actions'],
                                                      'container': C['image'], 'env': ENV}, indent=2))
        (raw / 'runner.json').write_text(json.dumps({'platform': platform.platform(),
            'os_release': pathlib.Path('/etc/os-release').read_text(),
            'node': command(['node', '--version']), 'npm': command(['npm', '--version'])}, indent=2))
        (inputs / 'source.json').write_text(json.dumps(C['source_sha256']))
        (inputs / 'mode').write_text('proof')
        with (inputs / 'candidate.tar').open('wb') as f:
            subprocess.run(['git', 'archive', '--format=tar', C['sha']], cwd=candidate, stdout=f, check=True)
        # Acquisition consumes only reviewed manifests, never candidate configuration or scripts.
        acquire = output / 'acquire'; acquire.mkdir()
        for f in ('package.json', 'package-lock.json'): shutil.copyfile(candidate / f, acquire / f)
        lock = json.loads((acquire / 'package-lock.json').read_text())
        for name, package in lock['packages'].items():
            if name:
                assert package.get('resolved', '').startswith('https://registry.npmjs.org/')
                assert package.get('integrity', '').startswith('sha512-')
        home = output / 'acquisition-home'; home.mkdir()
        for name in ('user.npmrc', 'global.npmrc'): (home / name).write_text('')
        node_home = pathlib.Path(shutil.which('node')).resolve().parent.parent
        acquisition_env = {'PATH': str(node_home / 'bin') + ':/usr/bin:/bin', 'HOME': str(home),
                           'LANG': 'C.UTF-8', 'CI': 'true', 'npm_config_userconfig': str(home / 'user.npmrc'),
                           'npm_config_globalconfig': str(home / 'global.npmrc')}
        command(['npm', 'ci', '--ignore-scripts', '--no-audit', '--no-fund',
                 '--cache', str(inputs / 'npm-cache')], cwd=acquire, env=acquisition_env,
                timeout=600, log=raw / 'acquisition.log')
        outcome['stages'].append('locked-downloads-no-lifecycle')
        stage(inputs / 'fonts')
        shutil.copyfile(inputs / 'fonts/manifest.json', raw / 'font-inputs.json')
        command(['docker', 'pull', '--platform', 'linux/amd64', C['image']], timeout=300, log=raw / 'image.log')
        bridge = json.loads(command(['docker', 'network', 'inspect', 'bridge']))[0]
        ip = next(c['Gateway'] for c in bridge['IPAM']['Config'] if ':' not in c['Gateway'])
        receiver = Receiver(ip)
        (inputs / 'receiver.json').write_text(json.dumps(receiver.config))
        # Default seccomp, private PID/IPC namespaces, no devices or host sockets.
        args = ['docker', 'create', '--platform', 'linux/amd64', '--network', 'none',
                '--user', '1000:1000', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
                '--read-only', '--pids-limit', '512', '--ipc', 'private', '--shm-size', '1g',
                '--tmpfs', '/work:rw,exec,uid=1000,gid=1000,mode=0755,size=6g',
                '--tmpfs', '/tmp:rw,exec,uid=1000,gid=1000,mode=1777,size=1g',
                '--tmpfs', '/home/pwuser:rw,uid=1000,gid=1000,mode=0700,size=128m']
        for host, target, readonly in [(ROOT, '/qa', True), (inputs, '/inputs', True),
                                       (node_home, '/node', True), (execution, '/out', False)]:
            args += ['--mount', f'type=bind,src={host},dst={target}' + (',readonly' if readonly else '')]
        args += ['--entrypoint', '/usr/bin/env', C['image'], '-i']
        args += [f'{k}={v}' for k, v in ENV.items()]
        args += ['/bin/bash', '/qa/inside.sh']
        container = command(args)
        inspection = json.loads(command(['docker', 'inspect', container]))[0]
        h = inspection['HostConfig']
        assert h['NetworkMode'] == 'none' and not h['Privileged'] and h['ReadonlyRootfs']
        assert h['CapDrop'] == ['ALL'] and 'no-new-privileges' in h['SecurityOpt']
        assert inspection['Config']['User'] == '1000:1000'
        assert {m['Destination'] for m in inspection['Mounts'] if m['Type'] == 'bind'} == {'/qa', '/inputs', '/node', '/out'}
        (raw / 'container-controls.json').write_text(json.dumps({'HostConfig': h,
            'Mounts': inspection['Mounts'], 'Image': inspection['Image']}, indent=2))
        command(['docker', 'start', '--attach', container], timeout=1800, log=raw / 'container.log')
        state = json.loads(command(['docker', 'inspect', container]))[0]['State']
        assert state['ExitCode'] == 0 and not state['OOMKilled'], f'Container failure: {state}'
        assert not receiver.hits, 'Controlled receiver reached from candidate boundary'
        # Sanitize/copy after the container stops; reject symlinks before host assessment.
        sanitize(execution, raw / 'execution')
        probe = [json.loads(line) for line in (raw / 'execution/isolation.jsonl').read_text().splitlines()]
        for event in ('MSW_BYPASS_BLOCKED', 'CHILD_BOUNDARY_PASS', 'ISOLATION_PROBE_COMPLETE'):
            assert sum(x['event'] == event for x in probe) == 1, f'Missing actual isolation proof: {event}'
        for event in ('BROWSER_BOUNDARY_PASS', 'PROBE_BROWSER_CLOSED'):
            matches = [x for x in probe if x['event'] == event]
            assert len(matches) == 2 and {x['engine'] for x in matches} == {'chromium', 'webkit'}
        outcome.update(assess_proof_execution(raw / 'execution'))
    except Exception as error:
        outcome['error'] = f'{type(error).__name__}: {error}'
        raise
    finally:
        # On any failed build/test, preserve logs and still check source/receiver/cleanup.
        errors = []
        if container:
            try: command(['docker', 'rm', '--force', container], timeout=30)
            except Exception as e: errors.append(f'container cleanup: {e}')
        if receiver:
            try:
                receiver.close()
                (raw / 'external-receiver.json').write_text(json.dumps({
                    'positive_controls': receiver.positive, 'isolation_hits': receiver.hits}, indent=2))
                assert not receiver.hits, 'External receiver saw isolated execution'
            except Exception as e: errors.append(f'receiver: {e}')
        try:
            after = identity(candidate)
            (raw / 'source-after.json').write_text(json.dumps(after, indent=2))
        except Exception as e: errors.append(f'post-source: {e}')
        try:
            if not (raw / 'execution').exists(): sanitize(execution, raw / 'execution')
        except Exception as e: errors.append(f'unsafe execution artifacts: {e}')
        if errors: outcome.update(status='FAIL', hosted_qa='NOT_RUN', cleanup_errors=errors)
        (raw / 'outcome.json').write_text(json.dumps(outcome, indent=2))
        try: sanitize(raw, publish)
        except Exception as error:
            shutil.rmtree(publish); publish.mkdir()
            (publish / 'artifact-failure.json').write_text(json.dumps({'status': 'FAIL', 'error': str(error)}))
            raise
        assert outcome['status'] == 'PASS', json.dumps(outcome)


def parse_args(argv=None):
    p = argparse.ArgumentParser()
    p.add_argument('--candidate', type=pathlib.Path, required=True)
    p.add_argument('--output', type=pathlib.Path, required=True)
    p.add_argument('--proof-only', action='store_true', required=True, help='Isolation plus exact font build only; never runs 949-test scope')
    p.add_argument('--controls-verification', choices=['hosted', 'local'], required=True)
    p.add_argument('--controls-manifest', type=pathlib.Path)
    p.add_argument('--manifest-sha256')
    return p.parse_args(argv)


if __name__ == '__main__':
    args = parse_args()
    run(args.candidate.resolve(), args.output.resolve(), args.proof_only,
        args.controls_manifest, args.manifest_sha256, args.controls_verification)
