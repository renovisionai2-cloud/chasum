"""G0 controls tests only: synthetic data and mocked commands; no Docker/app execution."""
import contextlib
import copy
import hashlib
import io
import json
import os
from pathlib import Path
import shlex
import subprocess
import tempfile
import unittest
from unittest.mock import call, patch

import driver

SHA = '1' * 40
ROOT = Path(__file__).resolve().parent
PROOF = {'status': 'PASS', 'kind': 'bounded-proof-only', 'hosted_qa': 'NOT_RUN', 'regression': 'NOT_RERUN'}
STAGES = [{'stage': name, 'status': 'PASS'} for name in
          ['offline-install', 'original-build-and-font-byte-validation']]


class ControlsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='chasum-g0-controls-')
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.env = patch.dict(os.environ, {}, clear=True)
        self.env.start(); self.addCleanup(self.env.stop)

    def local_manifest(self):
        payload = self.base / 'payload'; payload.mkdir()
        root = payload / 'scripts/qa-decision-b'; root.mkdir(parents=True)
        target = payload / 'control.txt'; target.write_text('reviewed control')
        manifest = self.base / 'external-manifest.json'
        manifest.write_text(json.dumps({'control.txt': hashlib.sha256(target.read_bytes()).hexdigest()}))
        digest = hashlib.sha256(manifest.read_bytes()).hexdigest()
        return root, target, manifest, digest

    def proof_artifacts(self):
        out = self.base / 'execution'; out.mkdir()
        (out / 'stages.jsonl').write_text(''.join(json.dumps(s) + '\n' for s in STAGES))
        (out / 'proof-assessment.json').write_text(json.dumps(PROOF))
        return out

    def test_hosted_identity_records_actual_commit_and_checks_all_untracked(self):
        os.environ.update(CONTROL_SHA=SHA, GITHUB_ACTIONS='true')
        with patch.object(driver, 'command', side_effect=[SHA, '']) as command:
            self.assertEqual(driver.verify_controls('hosted'),
                             {'verification': 'hosted-git', 'sha': SHA, 'clean': True})
        self.assertEqual(command.call_args_list, [
            call(['git', 'rev-parse', 'HEAD'], cwd=driver.ROOT),
            call(['git', 'status', '--porcelain', '--untracked-files=all'], cwd=driver.ROOT)])

    def test_missing_or_malformed_control_sha_fails_before_git(self):
        for value in [None, '', 'main', '1' * 39, '1' * 41, 'g' * 40, SHA + '\n']:
            with self.subTest(value=value), patch.object(driver, 'command') as command:
                os.environ.clear()
                if value is not None: os.environ['CONTROL_SHA'] = value
                with self.assertRaises(AssertionError): driver.verify_controls('hosted')
                command.assert_not_called()

    def test_mismatched_controls_head_fails(self):
        os.environ['CONTROL_SHA'] = SHA
        with patch.object(driver, 'command', return_value='2' * 40), self.assertRaises(AssertionError):
            driver.verify_controls('hosted')

    def test_tracked_staged_and_untracked_dirt_fails(self):
        os.environ['CONTROL_SHA'] = SHA
        for dirty in [' M tracked.py', 'M  staged.py', '?? unexpected/nested.txt']:
            with self.subTest(dirty=dirty), patch.object(driver, 'command', side_effect=[SHA, dirty]):
                with self.assertRaises(AssertionError): driver.verify_controls('hosted')

    def test_hosted_cannot_fall_back_to_valid_local_manifest(self):
        root, _, manifest, digest = self.local_manifest()
        for control_sha in [None, SHA]:
            with self.subTest(control_sha=control_sha), patch.object(driver, 'ROOT', root), \
                    patch.object(driver, 'source') as source:
                os.environ.clear()
                if control_sha: os.environ['CONTROL_SHA'] = control_sha
                with self.assertRaises(AssertionError): driver.verify_controls('hosted', manifest, digest)
                source.assert_not_called()

    def test_verification_selection_is_mandatory_and_explicit(self):
        for mode in [None, '', 'automatic', 'manifest-if-no-sha']:
            with self.subTest(mode=mode), self.assertRaises(AssertionError): driver.verify_controls(mode)

    def test_github_execution_rejects_explicit_local_downgrade(self):
        root, _, manifest, digest = self.local_manifest()
        os.environ['GITHUB_ACTIONS'] = 'true'
        with patch.object(driver, 'ROOT', root), self.assertRaises(AssertionError):
            driver.verify_controls('local', manifest, digest)

    def test_explicit_local_manifest_remains_valid(self):
        root, _, manifest, digest = self.local_manifest()
        with patch.object(driver, 'ROOT', root), patch.object(driver, 'command') as command:
            result = driver.verify_controls('local', manifest, digest)
        self.assertEqual(result['manifest_sha256'], digest)
        self.assertEqual(result['verification'], 'local-manifest')
        command.assert_not_called()

    def test_missing_local_manifest_or_hash_fails(self):
        for manifest, digest in [(None, None), (self.base / 'absent', None), (None, 'a' * 64)]:
            with self.subTest(manifest=manifest), self.assertRaises(AssertionError):
                driver.verify_controls('local', manifest, digest)

    def test_nonexistent_manifest_file_fails(self):
        with self.assertRaises(FileNotFoundError):
            driver.verify_controls('local', self.base / 'absent', 'a' * 64)

    def test_changed_manifest_bytes_fail(self):
        root, _, manifest, digest = self.local_manifest()
        manifest.write_text(manifest.read_text() + '\n')
        with patch.object(driver, 'ROOT', root), self.assertRaises(AssertionError):
            driver.verify_controls('local', manifest, digest)

    def test_wrong_expected_manifest_hash_fails(self):
        root, _, manifest, _ = self.local_manifest()
        with patch.object(driver, 'ROOT', root), self.assertRaises(AssertionError):
            driver.verify_controls('local', manifest, '0' * 64)

    def test_missing_manifest_source_file_fails(self):
        root, target, manifest, digest = self.local_manifest(); target.unlink()
        with patch.object(driver, 'ROOT', root), self.assertRaises(AssertionError):
            driver.verify_controls('local', manifest, digest)

    def test_changed_manifest_source_file_fails(self):
        root, target, manifest, digest = self.local_manifest(); target.write_text('changed')
        with patch.object(driver, 'ROOT', root), self.assertRaises(AssertionError):
            driver.verify_controls('local', manifest, digest)

    def test_exact_proof_stages_report_qa_not_run(self):
        self.assertEqual(driver.assess_proof_execution(self.proof_artifacts()),
                         {'status': 'PASS', 'hosted_qa': 'NOT_RUN', 'kind': 'bounded-proof-only'})

    def test_missing_stage_file_fails(self):
        out = self.proof_artifacts(); (out / 'stages.jsonl').unlink()
        with self.assertRaises(FileNotFoundError): driver.assess_proof_execution(out)

    def test_missing_extra_duplicate_reordered_or_failed_stages_fail(self):
        out = self.proof_artifacts()
        variants = [STAGES[:1], [], list(reversed(STAGES)), STAGES + STAGES[:1],
                    STAGES + [{'stage': 'typecheck', 'status': 'PASS'}],
                    STAGES + [{'stage': 'declared-vitest-scope', 'status': 'FAIL'}],
                    [dict(STAGES[0], status='FAIL'), STAGES[1]]]
        for stages in variants:
            with self.subTest(stages=stages):
                (out / 'stages.jsonl').write_text(''.join(json.dumps(s) + '\n' for s in stages))
                with self.assertRaises(AssertionError): driver.assess_proof_execution(out)

    def test_any_full_qa_artifact_fails_even_with_passing_proof_stages(self):
        out = self.proof_artifacts()
        for name in ['regression.json', 'regression.log', 'typecheck.log', 'assessment.json']:
            with self.subTest(name=name):
                (out / name).write_text('attempted full QA')
                with self.assertRaises(AssertionError): driver.assess_proof_execution(out)
                (out / name).unlink()

    def test_missing_or_contradictory_proof_report_fails(self):
        out = self.proof_artifacts(); report = out / 'proof-assessment.json'
        report.unlink()
        with self.assertRaises(FileNotFoundError): driver.assess_proof_execution(out)
        for key, value in [('status', 'FAIL'), ('hosted_qa', 'PASS'), ('regression', 'PASSED'), ('kind', 'full-qa')]:
            with self.subTest(key=key):
                report.write_text(json.dumps(dict(PROOF, **{key: value})))
                with self.assertRaises(AssertionError): driver.assess_proof_execution(out)

    def test_cli_accepts_only_explicit_proof_and_verification(self):
        base = ['--candidate', '/synthetic/candidate', '--output', '/synthetic/output']
        args = driver.parse_args(base + ['--proof-only', '--controls-verification', 'hosted'])
        self.assertIs(args.proof_only, True); self.assertEqual(args.controls_verification, 'hosted')
        for extra in [[], ['--proof-only'], ['--controls-verification', 'hosted'],
                      ['--proof-only', '--controls-verification', 'auto'],
                      ['--full-qa', '--controls-verification', 'hosted']]:
            with self.subTest(extra=extra), contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
                driver.parse_args(base + extra)

    def test_run_api_cannot_default_or_select_full_qa(self):
        for mode in [None, False, 'hosted']:
            with self.subTest(mode=mode), self.assertRaises(AssertionError):
                driver.run(self.base / 'candidate', self.base / 'output', proof_only=mode, controls_verification='hosted')
        self.assertFalse((self.base / 'output').exists())

    def test_workflow_invocation_requires_hosted_proof_without_manifest_hash(self):
        text = (ROOT.parent.parent / '.github/workflows/gvm-tax-hosted-qa.yml').read_text()
        invocation = next(line.strip() for line in text.replace('\\\n', ' ').splitlines()
                          if 'python3 -B controls/scripts/qa-decision-b/driver.py' in line)
        tokens = shlex.split(invocation)
        self.assertEqual(tokens[:3], ['python3', '-B', 'controls/scripts/qa-decision-b/driver.py'])
        args = driver.parse_args(tokens[3:])
        self.assertIs(args.proof_only, True); self.assertEqual(args.controls_verification, 'hosted')
        self.assertIsNone(args.controls_manifest); self.assertIsNone(args.manifest_sha256)
        self.assertIn('CONTROL_SHA: ${{ github.sha }}', text)
        self.assertNotIn('npm run typecheck', text); self.assertNotIn('vitest', text)

    def synthetic_shell(self, mode='proof', remove_exit=False):
        # Rebind only mount paths to empty local fixtures. Every executable candidate
        # command is replaced by a sentinel stub; no Node/npm/Python app code runs.
        for name in ['work', 'inputs/npm-cache', 'out', 'qa', 'bin']:
            (self.base / name).mkdir(parents=True, exist_ok=True)
        (self.base / 'inputs/npm-cache/synthetic').write_text('cache fixture')
        if mode is not None: (self.base / 'inputs/mode').write_text(mode)
        log = self.base / 'commands.log'
        stub = '''#!/bin/bash
name=${0##*/}
printf '%s\\n' "$name $*" >> "$COMMAND_LOG"
case "$name $*" in
  'npm run typecheck'*|*'vitest'*|*' results '*) exit 97 ;;
  'node -p '*) printf '22.23.4\\n' ;;
  'node --version') printf 'v22.23.4\\n' ;;
  'node -'|'python3 -') /bin/cat >/dev/null ;;
  'python3 '*'/fonts.py serve '*) exec /bin/sleep 30 ;;
esac
exit 0
'''
        for name in ['node', 'npm', 'python3', 'tar']:
            p = self.base / 'bin' / name; p.write_text(stub); p.chmod(0o755)
        text = (ROOT / 'inside.sh').read_text()
        if remove_exit:
            self.assertEqual(text.count('  exit 0\n'), 1)
            text = text.replace('  exit 0\n', '  : # synthetic early-exit fault\n')
        for mount in ['/work', '/inputs', '/out', '/qa']:
            text = text.replace(mount, str(self.base / mount.lstrip('/')))
        script = self.base / 'inside-synthetic.sh'; script.write_text(text)
        result = subprocess.run(['/bin/bash', str(script)], env={
            'PATH': str(self.base / 'bin') + ':/usr/bin:/bin', 'COMMAND_LOG': str(log)},
            capture_output=True, text=True, timeout=10)
        return result, log.read_text() if log.exists() else ''

    def test_actual_shell_control_flow_exits_before_typecheck_or_vitest(self):
        result, log = self.synthetic_shell()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('npm run build', log)
        self.assertNotIn('typecheck', log); self.assertNotIn('vitest', log)
        self.assertEqual(driver.assess_proof_execution(self.base / 'out')['hosted_qa'], 'NOT_RUN')

    def test_shell_missing_mode_fails_before_candidate_commands(self):
        result, log = self.synthetic_shell(mode=None)
        self.assertNotEqual(result.returncode, 0); self.assertEqual(log, '')

    def test_shell_full_qa_mode_fails_before_candidate_commands(self):
        result, log = self.synthetic_shell(mode='hosted')
        self.assertNotEqual(result.returncode, 0); self.assertEqual(log, '')

    def test_shell_fallthrough_fault_fails_without_reaching_regression(self):
        result, log = self.synthetic_shell(remove_exit=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('must not reach full QA', result.stderr)
        self.assertNotIn('typecheck', log); self.assertNotIn('vitest', log)


if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser(); p.add_argument('--result', type=Path, required=True)
    args = p.parse_args()
    result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(ControlsTests))
    args.result.write_text(json.dumps({
        'status': 'PASS' if result.wasSuccessful() else 'FAIL', 'tests': result.testsRun,
        'failures': len(result.failures), 'errors': len(result.errors), 'skips': len(result.skipped),
        'scope': 'G0 controls; mocked Git, synthetic manifests/stages, sentinel shell commands',
        'candidate_builds': 0, 'candidate_tests': 0, 'docker_runs': 0, 'hosted_runs': 0,
        'linux_isolation': 'NOT_PROVEN', 'hosted_qa': 'NOT_RUN'
    }, indent=2) + '\n')
    raise SystemExit(0 if result.wasSuccessful() else 1)
