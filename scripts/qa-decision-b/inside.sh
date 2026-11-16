#!/bin/bash
set -euo pipefail
umask 022
mode=$(cat /inputs/mode)
test "$mode" = proof
cd /work
tar -xf /inputs/candidate.tar
# All candidate lifecycle code executes here, with no external network interface.
node /qa/probe.mjs kernel
node --version > /out/node-version.txt
npm --version > /out/npm-version.txt
test "$(node -p 'process.versions.node')" = 22.23.4
python3 /qa/assess.py source /work /inputs/source.json
mkdir -p /work/npm-cache /out/screenshots
cp -R /inputs/npm-cache/. /work/npm-cache/
npm ci --offline --no-audit --no-fund --cache /work/npm-cache 2>&1 | tee /out/install.log
node - <<'JS'
const fs = require('node:fs'), assert = require('node:assert/strict');
assert.equal(require('next/package.json').version, '16.4.3');
assert.equal(require('playwright-core/package.json').version, '1.61.1');
fs.writeFileSync('/out/browser-lock.json', fs.readFileSync('node_modules/playwright-core/browsers.json'));
JS
printf '%s\n' '{"stage":"offline-install","status":"PASS"}' >> /out/stages.jsonl
node /qa/probe.mjs browser 2>&1 | tee /out/isolation.jsonl
if test "$mode" = hosted; then
  npm run typecheck 2>&1 | tee /out/typecheck.log
  printf '%s\n' '{"stage":"typecheck","status":"PASS"}' >> /out/stages.jsonl
fi
python3 /qa/fonts.py serve /inputs/fonts > /out/font-server.jsonl 2>&1 &
font_pid=$!
trap 'kill "$font_pid" 2>/dev/null || true; wait "$font_pid" 2>/dev/null || true' EXIT
python3 - <<'PY'
import json,time,urllib.request
p='/inputs/fonts/manifest.json'
a=json.load(open(p))['assets'][0]['sha256']
for i in range(40):
    try:
        with urllib.request.urlopen('http://127.0.0.1:43197/'+a,timeout=1) as r:
            assert r.status==200
        break
    except OSError:
        if i==39: raise
        time.sleep(.1)
PY
NEXT_FONT_GOOGLE_MOCKED_RESPONSES=/inputs/fonts/responses.cjs npm run build 2>&1 | tee /out/build.log
python3 /qa/assess.py fonts /work /inputs/fonts/manifest.json /out/font-server.jsonl
printf '%s\n' '{"stage":"original-build-and-font-byte-validation","status":"PASS"}' >> /out/stages.jsonl
kill "$font_pid"
wait "$font_pid" 2>/dev/null || true
trap - EXIT
if test "$mode" = proof; then
  python3 /qa/assess.py source /work /inputs/source.json
  printf '%s\n' '{"status":"PASS","kind":"bounded-proof-only","hosted_qa":"NOT_RUN","regression":"NOT_RERUN"}' > /out/proof-assessment.json
  exit 0
fi
echo "Proof-only execution must not reach full QA" >&2
exit 1
# Retained full-QA inventory path is unreachable; later approval requires a reviewed controls change.
# One declared scope. No focused-plus-full repeat; unchanged fixture deadlines.
mapfile -t test_files < <(python3 -c 'import json; print("\n".join(json.load(open("/qa/contract.json"))["executed_files"]))')
./node_modules/.bin/vitest run "${test_files[@]}" --reporter=default --reporter=json --outputFile=/out/regression.json 2>&1 | tee /out/regression.log
printf '%s\n' '{"stage":"declared-vitest-scope","status":"PASS"}' >> /out/stages.jsonl
python3 /qa/assess.py source /work /inputs/source.json
python3 /qa/assess.py results /out /qa/contract.json
