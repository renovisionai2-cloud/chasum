// Bounded synthetic isolation proof. No real service endpoints or route mocks.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import dgram from 'node:dgram';
import dns from 'node:dns';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const mode = process.argv[2];
const log = (event, detail = {}) => console.log(JSON.stringify({ event, ...detail }));
const approved = {
  PATH: '/node/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
  HOME: '/home/pwuser', TMPDIR: '/tmp', LANG: 'C.UTF-8', CI: 'true',
  NEXT_TELEMETRY_DISABLED: '1', PLAYWRIGHT_BROWSERS_PATH: '/ms-playwright',
  CHASUM_TAX_EVIDENCE: '/out/screenshots',
};
const receiver = JSON.parse(fs.readFileSync('/inputs/receiver.json', 'utf8'));

function kernel() {
  assert.equal(process.platform, 'linux');
  assert.notEqual(process.getuid(), 0);
  for (const [key, value] of Object.entries(approved)) assert.equal(process.env[key], value, key);
  assert.deepEqual(Object.keys(process.env).filter(k => !(k in approved) &&
    !['PWD', 'SHLVL', '_'].includes(k)), [], 'Unapproved environment');
  const status = fs.readFileSync('/proc/self/status', 'utf8');
  for (const key of ['CapInh', 'CapPrm', 'CapEff', 'CapBnd', 'CapAmb'])
    assert.match(status, new RegExp(`^${key}:\\s+0+$`, 'm'));
  assert.match(status, /^NoNewPrivs:\s+1$/m);
  assert.deepEqual(fs.readdirSync('/sys/class/net'), ['lo']);
  const routes = fs.readFileSync('/proc/net/route', 'utf8').trim().split('\n');
  assert.equal(routes.length, 1, 'External IPv4 route');
  for (const row of fs.readFileSync('/proc/net/ipv6_route', 'utf8').trim().split('\n'))
    if (row) assert.equal(row.trim().split(/\s+/).at(-1), 'lo', 'External IPv6 route');
  for (const p of ['/var/run/docker.sock', '/run/podman/podman.sock', '/home/pwuser/.aws',
    '/home/pwuser/.ssh', '/home/pwuser/.npmrc']) assert.equal(fs.existsSync(p), false, p);
  log('KERNEL_BOUNDARY_PASS', { uid: process.getuid(), environment: approved });
}

async function blockedTCP(host, port) {
  await new Promise((resolve, reject) => {
    const socket = net.connect({ host, port });
    socket.setTimeout(1500);
    socket.once('connect', () => { socket.destroy(); reject(new Error(`TCP escaped: ${host}`)); });
    socket.once('error', error => { socket.destroy(); log('TCP_BLOCKED', { host, code: error.code }); resolve(); });
    socket.once('timeout', () => { socket.destroy(); reject(new Error(`Inconclusive TCP timeout: ${host}`)); });
  });
}

async function escapes() {
  await blockedTCP(receiver.ip, receiver.http_port);
  await blockedTCP('2001:db8::191', receiver.http_port);
  await assert.rejects(fetch(`http://${receiver.ip}:${receiver.http_port}/bypassed`,
    { signal: AbortSignal.timeout(2000) }));
  for (const [kind, address] of [['udp4', receiver.ip], ['udp6', '2001:db8::191']]) {
    await new Promise((resolve, reject) => {
      const socket = dgram.createSocket(kind);
      const timer = setTimeout(() => { socket.close(); reject(new Error('UDP proof timeout')); }, 2000);
      socket.send(Buffer.from('isolation-probe'), receiver.udp_port, address, error => {
        clearTimeout(timer); socket.close();
        if (!error) reject(new Error('UDP send accepted; boundary proof incomplete'));
        else { log('UDP_BLOCKED', { kind, code: error.code }); resolve(); }
      });
    });
  }
  const resolver = new dns.promises.Resolver({ timeout: 750, tries: 1 });
  resolver.setServers([`${receiver.ip}:${receiver.udp_port}`]);
  await assert.rejects(resolver.resolve4('qa.invalid'));
  log('CONTROLLED_DNS_BLOCKED');
}

kernel();
if (mode === 'kernel') process.exit(0);
if (mode === 'child') { await escapes(); log('CHILD_BOUNDARY_PASS'); process.exit(0); }
assert.equal(mode, 'browser');
const require = createRequire('/work/package.json');
const { setupServer } = await import(require.resolve('msw/node'));
const mocks = setupServer();
mocks.listen({ onUnhandledRequest: 'bypass' });
try { await escapes(); log('MSW_BYPASS_BLOCKED'); } finally { mocks.close(); }
const child = spawnSync(process.execPath, ['/qa/probe.mjs', 'child'],
  { encoding: 'utf8', timeout: 12000, env: { ...approved } });
process.stdout.write(child.stdout || '');
assert.equal(child.status, 0, child.stderr);
const server = http.createServer((request, response) => {
  response.setHeader('Content-Type', 'text/html'); response.end('<h1>synthetic loopback</h1>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const local = `http://127.0.0.1:${server.address().port}`;
const { chromium, webkit } = require('playwright-core');
try {
  assert.equal((await fetch(local)).status, 200);
  for (const [engine, type] of Object.entries({ chromium, webkit })) {
    const browser = await type.launch();
    try {
      const page = await browser.newPage();
      await page.goto(local, { waitUntil: 'load', timeout: 5000 });
      assert.equal(await page.locator('h1').innerText(), 'synthetic loopback');
      for (const target of [`http://${receiver.ip}:${receiver.http_port}/browser`,
        `http://[2001:db8::191]:${receiver.http_port}/browser`, 'http://qa.invalid/'])
        await assert.rejects(page.goto(target, { waitUntil: 'load', timeout: 2500 }));
      log('BROWSER_BOUNDARY_PASS', { engine, version: browser.version() });
    } finally {
      await Promise.race([browser.close(), new Promise((_, reject) => {
        const t = setTimeout(() => reject(new Error(`${engine} cleanup timed out`)), 10000); t.unref();
      })]);
      log('PROBE_BROWSER_CLOSED', { engine });
    }
  }
} finally { await new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve())); }
log('ISOLATION_PROBE_COMPLETE');
