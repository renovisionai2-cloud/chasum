import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCapabilityPreimage } from './capability-evidence.mjs';

const name = 'unsafe-public-appointments-truncate';
const data = '/private/tmp/synthetic-public-oid/pgdata';
const user = 'proof_owner';
function witness(grantee) {
 return {
  case: name, mode: 'public', principal: 'service_role',
  table: 'public.appointments', privilege: 'TRUNCATE',
  database: 'd1_assertion_rollback', data_directory: data,
  session_user: user, current_user: user, server_addr: null,
  backend_pid: 123, transaction_id: '456', assertion: true,
  effective_privilege: true, leaf_effective_privilege: null,
  set_reachable: null, inherit_reachable: null, membership_chain: [],
  acl: [{ grantee, grantor: '10', privilege_type: 'TRUNCATE', is_grantable: false }],
 };
}
const parse = p => parseCapabilityPreimage('CAPABILITY_PREIMAGE:' + JSON.stringify(p), name, data, user);

for (const grantee of [0, '0']) {
 test(`accept exact PUBLIC zero (${typeof grantee}) without coercing the witness`, () => {
  const p = witness(grantee);
  assert.deepEqual(parse(p), p);
 });
}
for (const grantee of [null, undefined, '', ' ', '\t', '00', '0.0', ' 0', '0 ', '+0', '-0',
 '1', '10', '-1', 1, 10, -1, false, true, [], {}, [0]]) {
 test(`reject invalid PUBLIC grantee ${JSON.stringify(grantee)}`, () => {
  assert.throws(() => parse(witness(grantee)), /PUBLIC is not ACL grantee zero/);
 });
}
for (const acl of [undefined, null, [], [{ grantee: 0 }, { grantee: '0' }], [null], [{}]]) {
 test(`reject missing or invalid ACL ${JSON.stringify(acl)}`, () => {
  assert.throws(() => parse({ ...witness('0'), acl }));
 });
}
for (const change of [
 { assertion: false }, { effective_privilege: false }, { effective_privilege: 'true' },
 { database: 'other' }, { data_directory: '/other' }, { server_addr: '127.0.0.1' },
 { session_user: 'other' }, { current_user: 'other' }, { case: 'other' },
]) {
 test(`preserve existing rejection ${JSON.stringify(change)}`, () => {
  assert.throws(() => parse({ ...witness('0'), ...change }));
 });
}
