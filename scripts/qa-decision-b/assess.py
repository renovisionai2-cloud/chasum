"""Fail-closed source, font-output, test-inventory and actual-cleanup assessment."""
import collections
import hashlib
import json
import pathlib
import re
import sys


def source(root, expected):
    for name, digest in expected.items():
        p = root / name
        assert p.is_file() and not p.is_symlink(), f'Missing/changed tracked source: {name}'
        assert hashlib.sha256(p.read_bytes()).hexdigest() == digest, f'Source changed: {name}'


def events(text, prefix):
    return [json.loads(line.split(prefix, 1)[1]) for line in text.splitlines() if prefix in line]


def results(out, contract):
    report = json.loads((out / 'regression.json').read_text())
    expected = collections.Counter((a['file'], a['name']) for a in contract['assertions'])
    actual = collections.Counter()
    files = []
    failures, skips = [], []
    for suite in report['testResults']:
        name = suite['name']
        assert name.startswith('/work/'), 'Unexpected test root'
        name = name.removeprefix('/work/')
        files.append(name)
        assert suite['status'] == 'passed', f'Suite failure: {name}'
        for case in suite['assertionResults']:
            actual[name, case['fullName']] += 1
            if case['status'] in ('pending', 'skipped', 'todo'): skips.append([name, case['fullName']])
            elif case['status'] != 'passed': failures.append([name, case['fullName']])
    assert collections.Counter(files) == collections.Counter(contract['executed_files']), 'File omission/addition'
    assert actual == expected, 'Assertion omission/addition/rename/duplicate'
    assert report['success'] and report['numPassedTests'] == len(contract['assertions'])
    assert not failures and not skips, 'Failures or unexpected skips'
    assert report['numFailedTests'] == report['numPendingTests'] == report['numTodoTests'] == 0
    log = (out / 'regression.log').read_text()
    teardown = events(log, '[service-tax-teardown] ')
    readiness = events(log, '[service-tax-readiness] ')
    names = [e['event'] for e in teardown]
    for name in ['FIXTURE_TEARDOWN_BEGIN', 'CHROMIUM_CLOSE_BEGIN', 'WEBKIT_CLOSE_BEGIN',
                 'CHROMIUM_CLOSE_COMPLETE', 'WEBKIT_CLOSE_COMPLETE', 'VITE_CLOSE_BEGIN',
                 'VITE_CLOSE_COMPLETE', 'FIXTURE_TEARDOWN_COMPLETE']:
        assert names.count(name) == 1, f'Missing/duplicate actual cleanup event: {name}'
    assert len(names) == 8 and names[0] == 'FIXTURE_TEARDOWN_BEGIN'
    assert names[-1] == 'FIXTURE_TEARDOWN_COMPLETE'
    assert names.index('VITE_CLOSE_BEGIN') > max(names.index('CHROMIUM_CLOSE_COMPLETE'), names.index('WEBKIT_CLOSE_COMPLETE'))
    for event in teardown:
        if event['event'] in ('CHROMIUM_CLOSE_COMPLETE', 'WEBKIT_CLOSE_COMPLETE', 'VITE_CLOSE_COMPLETE'):
            assert event['status'] == 'completed'
    cases = {(engine, width, theme) for engine in ('chromium', 'webkit')
             for width in (390, 834, 1440) for theme in ('light', 'dark')}
    for milestone in ('NAVIGATION_BEGIN', 'DOCUMENT_RESPONSE', 'DOM_CONTENT_LOADED', 'LOAD', 'EDITOR_READY'):
        got = [e for e in readiness if e['event'] == milestone]
        assert len(got) == 12 and {(e['engine'], e['width'], e['theme']) for e in got} == cases, milestone
        if milestone == 'DOCUMENT_RESPONSE': assert all(e['status'] == 200 for e in got)
    assert not any('FAILED' in e['event'] for e in readiness)
    screenshots = {f'service-tax-{e}-{w}-{t}.png' for e, w, t in cases}
    assert {p.name for p in (out / 'screenshots').glob('*.png')} == screenshots
    assert all((out / 'screenshots' / p).stat().st_size > 0 for p in screenshots)
    assessment = {'status': 'PASS', 'files': len(files), 'assertions': sum(actual.values()),
                  'failures': failures, 'skips': skips, 'omitted_files': contract['omitted_files'],
                  'actual_teardown': teardown, 'browser_cases': 12}
    (out / 'assessment.json').write_text(json.dumps(assessment, indent=2) + '\n')
    return assessment


def fonts(root, manifest, server_log):
    expected = {a['sha256'] for a in manifest['assets']}
    emitted = {hashlib.sha256(p.read_bytes()).hexdigest() for p in (root / '.next/static/media').rglob('*') if p.is_file()}
    assert expected <= emitted, 'Original genuine font bytes absent from build output'
    accessed = {json.loads(line)['path'].lstrip('/') for line in server_log.read_text().splitlines()}
    assert accessed == expected, 'Staged font assets not all requested, or unexpected request'


if __name__ == '__main__':
    mode, *args = sys.argv[1:]
    if mode == 'source': source(pathlib.Path(args[0]), json.loads(pathlib.Path(args[1]).read_text()))
    elif mode == 'results': results(pathlib.Path(args[0]), json.loads(pathlib.Path(args[1]).read_text()))
    elif mode == 'fonts': fonts(pathlib.Path(args[0]), json.loads(pathlib.Path(args[1]).read_text()), pathlib.Path(args[2]))
    else: raise ValueError(mode)
