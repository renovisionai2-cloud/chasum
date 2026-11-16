"""Small harness tests; consumes a COPY of accepted evidence, never executes it."""
import argparse
import copy
import hashlib
import http.server
import json
import pathlib
import shutil
import tempfile
import threading
import urllib.error
import urllib.request
from unittest.mock import patch

import assess
import fonts
from driver import sanitize

ROOT = pathlib.Path(__file__).resolve().parent
C = json.loads((ROOT / 'contract.json').read_text())
checks = []


def rejects(name, function):
    try: function()
    except (AssertionError, KeyError, ValueError): checks.append(name)
    else: raise AssertionError('Guard incorrectly accepted: ' + name)


def run(evidence, font_assets):
    with tempfile.TemporaryDirectory(prefix='decision-b-controls-') as directory:
        temp = pathlib.Path(directory)
        original = json.loads((evidence / 'regression.json').read_text())
        for suite in original['testResults']:
            suite['name'] = '/work/' + suite['name'].split('/chasum/', 1)[1]
        log = (evidence / 'logs/regression.log').read_text()
        (temp / 'regression.log').write_text(log)
        shutil.copytree(evidence / 'screenshots', temp / 'screenshots')
        def assess_report(report):
            (temp / 'regression.json').write_text(json.dumps(report))
            return assess.results(temp, C)
        assert assess_report(original)['assertions'] == 949
        checks.append('accepted evidence parser positive control (replay only)')
        snapshot = temp / 'snapshot'; snapshot.mkdir()
        for name in ('regression.json', 'regression.log'): shutil.copyfile(temp / name, snapshot / name)
        shutil.copytree(temp / 'screenshots', snapshot / 'screenshots')
        sanitize(snapshot, temp / 'sanitized')
        assert assess.results(temp / 'sanitized', C)['assertions'] == 949
        checks.append('sanitized evidence preserves exact assertion inventory')
        (snapshot / 'escape.log').symlink_to(temp / 'regression.log')
        rejects('artifact symlink rejected', lambda: sanitize(snapshot, temp / 'unsafe-artifact'))
        (snapshot / 'escape.log').unlink()
        bad = copy.deepcopy(original); bad['testResults'].pop()
        rejects('missing test file fails', lambda: assess_report(bad))
        bad = copy.deepcopy(original); bad['testResults'][0]['assertionResults'].pop()
        rejects('missing assertion fails', lambda: assess_report(bad))
        bad = copy.deepcopy(original); bad['testResults'][0]['assertionResults'][0]['status'] = 'skipped'
        rejects('unexpected skipped assertion fails', lambda: assess_report(bad))
        bad = copy.deepcopy(original); bad['testResults'][0]['assertionResults'][0]['status'] = 'failed'
        rejects('failed assertion fails', lambda: assess_report(bad))
        (temp / 'regression.log').write_text(log.replace('WEBKIT_CLOSE_COMPLETE', 'WEBKIT_CLOSE_MISSING'))
        rejects('missing real WebKit close fails', lambda: assess_report(original))
        (temp / 'regression.log').write_text(log + '\n[service-tax-teardown] {"event":"VITE_CLOSE_ERROR","status":"timed_out"}\n')
        rejects('cleanup timeout/error fails', lambda: assess_report(original))
        (temp / 'regression.log').write_text(log.replace('EDITOR_READY', 'EDITOR_ABSENT', 1))
        rejects('missing navigation milestone fails', lambda: assess_report(original))
        (temp / 'regression.log').write_text(log)
        screenshot = next((temp / 'screenshots').glob('*.png')); screenshot.unlink()
        rejects('missing screenshot fails', lambda: assess_report(original))
        tracked = temp / 'tracked'; tracked.write_text('approved')
        digests = {'tracked': hashlib.sha256(b'approved').hexdigest()}
        assess.source(temp, digests); tracked.write_text('changed')
        rejects('source mutation fails', lambda: assess.source(temp, digests))
        lock = json.loads((ROOT / 'fonts-lock.json').read_text())
        by_url = {a['url']: (font_assets / a['sha256']).read_bytes() for a in lock['assets']}
        with patch.object(fonts, 'download', side_effect=lambda url: by_url[url]):
            fonts.stage(temp / 'fonts')
        checks.append('immutable genuine-font stage and CSS mapping')
        with patch.object(fonts, 'download', return_value=b'wOF2tampered'):
            rejects('changed remote font bytes fail pin', lambda: fonts.stage(temp / 'tampered-fonts'))
        server = http.server.HTTPServer(('127.0.0.1', 0), fonts.handler(temp / 'fonts'))
        thread = threading.Thread(target=server.serve_forever); thread.start()
        origin = f'http://127.0.0.1:{server.server_port}'
        try:
            for asset in lock['assets']:
                with urllib.request.urlopen(origin + '/' + asset['sha256'], timeout=2) as response:
                    assert hashlib.sha256(response.read()).hexdigest() == asset['sha256']
            checks.append('real loopback HTTP serves all 13 exact staged font assets')
            for label, path, method, status in [
                ('unknown path', '/unlisted', 'GET', 404),
                ('query injection', '/' + asset['sha256'] + '?url=https://example.invalid', 'GET', 404),
                ('traversal', '/../responses.cjs', 'GET', 404),
                ('absolute URL proxy', '/https://example.invalid/', 'GET', 404),
                ('POST', '/' + asset['sha256'], 'POST', 501),
                ('CONNECT', '/', 'CONNECT', 501),
            ]:
                try:
                    urllib.request.urlopen(urllib.request.Request(origin + path, method=method), timeout=2)
                except urllib.error.HTTPError as error: assert error.code == status
                else: raise AssertionError(label + ' unexpectedly allowed')
                checks.append('font store rejects ' + label)
        finally:
            server.shutdown(); server.server_close(); thread.join(2); assert not thread.is_alive()
        checks.append('actual local font-server cleanup')
    return {'status': 'PASS', 'checks': checks, 'count': len(checks), 'environment': 'Mac local harness checks',
            'linux_isolation': 'NOT_RUN', 'exact_candidate_build': 'NOT_RUN',
            'candidate_regression': 'NOT_RERUN', 'evidence_parser': 'accepted prior evidence replay only'}


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--evidence', type=pathlib.Path, required=True)
    p.add_argument('--font-assets', type=pathlib.Path, required=True)
    p.add_argument('--result', type=pathlib.Path, required=True)
    args = p.parse_args()
    result = run(args.evidence, args.font_assets)
    args.result.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))
