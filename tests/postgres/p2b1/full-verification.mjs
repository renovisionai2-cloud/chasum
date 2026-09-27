import assert from 'node:assert/strict';

// Only synthetic literals and runner-owned connections; never accepts a target.
export async function verify({ phase, query, concurrent, overlay }) {
  let assertions = 0;
  const A = '00000000-0000-0000-0000-000000000201';
  const B = '00000000-0000-0000-0000-000000000202';
  const lit = (v) => `'${String(v).replaceAll("'", "''")}'`;
  const json = (v) => `${lit(JSON.stringify(v))}::jsonb`;
  const service = (sql) => `begin; set local role service_role; set local request.jwt.claim.role='service_role'; ${sql}; commit;`;
  const check = async (sql, label) => {
    const { stdout } = await query(`select p2b1_test.expect((${sql}), ${lit(label)});`);
    assert.ok(stdout !== undefined); assertions++;
  };
  const env = (id, patch = {}) => ({ account: 'acct_synthetic', livemode: false,
    event_id: id, type: 'subscription.updated', customer_id: 'cus_A', subscription_id: 'sub_A', ...patch });
  const snapshot = (patch = {}) => ({ account: 'acct_synthetic', livemode: false,
    customer_id: 'cus_A', subscription_id: 'sub_A', price_id: 'price_A', status: 'active',
    period_start: '2026-09-01T00:00:00Z', period_end: '2026-10-01T00:00:00Z', ...patch });
  const revision = async () => (await query(`select subscription_revision from businesses where id='${A}';`)).stdout.trim();
  const receive = async (e) => query(service(`select public.saas_receive(${json(e)})`));
  const applySQL = (e, s, r) => `select public.saas_apply(${json(e)},${json(s)},${lit(r)}::bigint)`;
  const apply = async (e, s, r, expected) => {
    const result = await query(service(applySQL(e,s,r)));
    assert.equal(result.stdout.trim(), expected); assertions++;
  };
  const footprint = async () => (await query(`select jsonb_build_object('business',to_jsonb(b),
    'events',(select count(*) from subscription_events), 'invoices',(select count(*) from billing_invoices))
    from businesses b where id='${A}';`)).stdout;

  for (const role of ['anon','authenticated']) {
    for (const uid of ['101','103','104','105']) {
      const identity = `00000000-0000-0000-0000-000000000${uid}`;
      let sql = `begin; set local role ${role}; set local request.jwt.claim.role='${role}';
        set local request.jwt.claim.sub='${identity}';
        select p2b1_test.actor('${role}','${identity}');`;
      for (const assignment of ["subscription_plan_key='business'", "subscription_status='paused'",
        "billing_interval='yearly'", "trial_starts_at=now()", "trial_ends_at=now()",
        "current_period_start=now()", "current_period_end=now()", "cancel_at_period_end=true",
        "canceled_at=now()", "stripe_customer_id='forged'", "stripe_subscription_id='forged'",
        "private_alpha_enabled=true", "subscription_revision=999"]) {
        // Outsider UPDATE has no visible row: no effect is the correct RLS outcome.
        if (role === 'authenticated' && uid === '105') continue;
        sql += `select p2b1_test.expect_denied(${lit(`update businesses set ${assignment} where id='${A}'`)});`;
        assertions++;
      }
      for (const table of ['billing_invoices','subscription_events','saas_subscription_mappings','saas_billing_events']) {
        for (const mutation of [`delete from ${table}`, `update ${table} set ${table === 'billing_invoices' ? 'status=status' : table === 'subscription_events' ? 'event_type=event_type' : table === 'saas_billing_events' ? 'state=state' : 'price_id=price_id'}`, `insert into ${table} default values`]) {
          sql += `select p2b1_test.expect_denied(${lit(mutation)});`; assertions++;
        }
        if (table.startsWith('saas_')) { sql += `select p2b1_test.expect_denied('select * from ${table}');`; assertions++; }
      }
      assertions += 3;
      sql += `select p2b1_test.expect_denied(${lit(`insert into businesses(owner_id,name,slug,subscription_plan_key) values('${identity}','forged','forged','business')`)});
        select p2b1_test.expect_denied(${lit(`select public.saas_receive('{}'::jsonb)`)});
        select p2b1_test.expect_denied(${lit(`select public.saas_apply('{}','{}',0)`)}); rollback;`;
      phase(`client-${role}-${uid}`, sql, { transaction: false });
    }
  }
  phase('forged-jwt-role', `begin; set local role authenticated;
    set local request.jwt.claim.role='service_role';
    set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000101';
    select p2b1_test.expect_denied(${lit(`update businesses set subscription_plan_key='business' where id='${A}'`)});
    rollback;`, {transaction:false}); assertions++;
  phase('normal-settings-and-reads', `begin; set local role authenticated;
    set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000103';
    update businesses set name='Settings still work',timezone='America/Toronto' where id='${A}';
    select p2b1_test.expect((select name='Settings still work' and subscription_revision=0 from businesses where id='${A}'),'settings');
    select p2b1_test.expect((select count(*)=1 from billing_invoices),'admin invoice reads');
    select p2b1_test.expect((select count(*)=0 from subscription_events),'original direct-owner event audience');
    set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000101';
    select p2b1_test.expect((select count(*)=1 from subscription_events),'owner history reads'); rollback;`, { transaction:false });
  assertions += 4;
  phase('mapping', service(`insert into saas_subscription_mappings values
    ('${A}','acct_synthetic',false,'cus_A','sub_A','price_A','professional','monthly','cad')`), {transaction:false});
  await check(`select subscription_revision=1 from businesses where id='${A}'`, 'mapping invalidates snapshot');
  let e = env('first'); await receive(e);
  await apply(e,snapshot(),await revision(),'APPLIED');
  await check(`select subscription_plan_key='professional' and stripe_subscription_id='sub_A' from businesses where id='${A}'`, 'DB mapped Business');
  await check(`select subscription_plan_key='starter' and stripe_subscription_id is null and subscription_revision=0 from businesses where id='${B}'`, 'other Business unchanged');
  let before = await footprint(); await apply(e,snapshot(),0,'APPLIED');
  assert.equal(await footprint(),before); assertions++;

  for (const [id, envelopePatch, snapshotPatch] of [
    ['metadata',{metadata_business_id:B},{}], ['mode',{livemode:true},{}],
    ['account',{account:'wrong'},{}], ['customer',{customer_id:'wrong'},{}],
    ['snapshot-mode',{}, {livemode:true}], ['snapshot-account',{}, {account:'wrong'}],
    ['snapshot-price',{}, {price_id:'wrong'}], ['snapshot-customer',{}, {customer_id:'wrong'}],
  ]) {
    e=env(id,envelopePatch); await receive(e); before=await footprint();
    await apply(e,snapshot(snapshotPatch),await revision(),'BLOCKED');
    assert.equal(await footprint(),before); assertions++;
  }
  e=env('collision'); await receive(e);
  assert.equal((await receive({...e,metadata_business_id:B})).stdout.trim(),'ENVELOPE_MISMATCH'); assertions++;

  e=env('same-event'); await receive(e); let r=await revision(); before=await footprint();
  let results=await concurrent([service(applySQL(e,snapshot(),r)), service(applySQL(e,snapshot(),r))]);
  assert.deepEqual(results.map(x=>x.stdout.trim()),['APPLIED','APPLIED']); assertions++;
  await check(`select count(*)=1 from subscription_events where metadata->>'event_id'='same-event'`, 'same event exactly once');
  await check(`select subscription_revision=${BigInt(r)+1n} from businesses where id='${A}'`, 'one revision');

  const one=env('concurrent-one'), two=env('concurrent-two'); await receive(one); await receive(two); r=await revision();
  results=await concurrent([service(applySQL(one,snapshot(),r)), service(applySQL(two,snapshot({status:'paused'}),r))]);
  assert.deepEqual(results.map(x=>x.stdout.trim()).sort(),['APPLIED','RETRY_REQUIRED']); assertions++;
  const retry=results[0].stdout.trim()==='RETRY_REQUIRED'?one:two;
  await apply(retry,snapshot(),await revision(),'APPLIED');

  const delayed=env('delayed'), newer=env('newer'); await receive(delayed); await receive(newer); r=await revision();
  await apply(newer,snapshot({status:'paused'}),r,'APPLIED'); before=await footprint();
  await apply(delayed,snapshot(),r,'RETRY_REQUIRED'); assert.equal(await footprint(),before); assertions++;
  // Exact existing Platform Admin write shape participates even on a no-op assignment.
  r=await revision(); phase('platform-admin-assignment',service(`update businesses set subscription_plan_key='starter',updated_at=now() where id='${A}'`),{transaction:false});
  before=await footprint(); await apply(delayed,snapshot(),r,'RETRY_REQUIRED'); assert.equal(await footprint(),before); assertions++;

  e=env('crash-after-receipt'); await receive(e);
  await check(`select count(*)=1 from saas_billing_events where event_id='crash-after-receipt' and state='RECEIVED' and completed_at is null`, 'recovery scan includes received');
  await apply(e,snapshot(),await revision(),'APPLIED');
  e=env('failed-apply',{type:'invoice.paid',invoice_id:'in_failure',currency:'cad',amount_cents:100}); await receive(e);
  before=await footprint(); await apply(e,snapshot({period_start:'invalid'}),await revision(),'BLOCKED');
  assert.equal(await footprint(),before); assertions++;
  await apply(e,snapshot(),await revision(),'APPLIED');

  // Fail AFTER Business/invoice writes to prove the entire effect block rolls back.
  phase('inject-history-failure', `create function p2b1_test.fail_history() returns trigger language plpgsql as $$
    begin raise exception 'synthetic history failure'; end $$;
    create trigger p2b1_history_failure before insert on subscription_events for each row execute function p2b1_test.fail_history();`);
  e=env('history-failure',{type:'invoice.paid',invoice_id:'in_rollback',currency:'cad',amount_cents:100}); await receive(e);
  before=await footprint(); await apply(e,snapshot(),await revision(),'BLOCKED');
  assert.equal(await footprint(),before); assertions++;
  phase('remove-history-failure','drop trigger p2b1_history_failure on subscription_events; drop function p2b1_test.fail_history();');
  await apply(e,snapshot(),await revision(),'APPLIED');
  // Mapping edits invalidate a snapshot even if the Business plan has not changed.
  e=env('mapping-edited'); await receive(e); r=await revision();
  phase('edit-mapping',service(`update saas_subscription_mappings set price_id=price_id where business_id='${A}'`),{transaction:false});
  before=await footprint(); await apply(e,snapshot(),r,'RETRY_REQUIRED');
  assert.equal(await footprint(),before); assertions++;

  e=env('unknown',{customer_id:'cus_B',subscription_id:'sub_B'}); await receive(e);
  await apply(e,snapshot(),0,'BLOCKED');
  phase('repair-mapping',service(`insert into saas_subscription_mappings values
    ('${B}','acct_synthetic',false,'cus_B','sub_B','price_B','business','yearly','cad')`),{transaction:false});
  const bRevision=(await query(`select subscription_revision from businesses where id='${B}';`)).stdout.trim();
  await apply(e,snapshot({customer_id:'cus_B',subscription_id:'sub_B',price_id:'price_B'}),bRevision,'APPLIED');
  for (const [id,patch,s] of [['unsupported',{type:'unsupported'},snapshot()],['unsupported-state',{},snapshot({status:'incomplete_expired'})]]) {
    e=env(id,patch); await receive(e); before=await footprint(); await apply(e,s,await revision(),'IGNORED');
    assert.equal(await footprint(),before); assertions++;
    await check(`select completed_at is not null from saas_billing_events where event_id=${lit(id)}`, 'terminal ignored');
  }
  e=env('invoice-one',{type:'invoice.paid',invoice_id:'in_shared',currency:'cad',amount_cents:100}); await receive(e);
  await apply(e,snapshot(),await revision(),'APPLIED'); before=await footprint();
  e={...e,event_id:'invoice-two'}; await receive(e); await apply(e,snapshot(),await revision(),'IGNORED');
  assert.equal(await footprint(),before); assertions++;
  await check(`select count(*)=1 from billing_invoices where stripe_invoice_id='in_shared'`, 'provider invoice exactly once');
  await check(`select count(*)=1 from subscription_events where metadata->>'event_id' in ('invoice-one','invoice-two')`, 'invoice history exactly once');

  for (const sql of [
    `insert into billing_invoices(business_id,invoice_number,stripe_invoice_id) values('${A}','duplicate','in_shared')`,
    `insert into saas_subscription_mappings values('${A}','other',false,'other','other','other','starter','monthly','cad')`,
    `update saas_subscription_mappings set subscription_id='sub_A' where business_id='${B}'`,
    `update saas_subscription_mappings set customer_id='cus_A' where business_id='${B}'`,
    `insert into saas_billing_events select * from saas_billing_events limit 1`,
  ]) {
    await assert.rejects(query(service(sql)),/duplicate key/); assertions++;
  }
  // A service-role write remains effective without synthetic JWT role claims.
  phase('service-without-jwt', `begin; set local role service_role;
    update businesses set trial_ends_at=trial_ends_at where id='${A}';
    select p2b1_test.expect((select count(*)=2 from saas_subscription_mappings),'service table access'); rollback;`, {transaction:false}); assertions++;
  await check(`select count(*)=5 and bool_and(relrowsecurity and relforcerowsecurity) from pg_class
    where oid in ('businesses'::regclass,'billing_invoices'::regclass,'subscription_events'::regclass,
      'saas_subscription_mappings'::regclass,'saas_billing_events'::regclass)`, 'RLS and FORCE RLS');

  if (overlay) {
    phase('incompatible-historical-state',service(`insert into plan_offers(id,plan_key,version,currency,sms_included,
      remove_branding_allowed,api_access_allowed,effective_from,is_locked) values
      ('00000000-0000-0000-0000-000000000301','business',1,'cad',false,false,false,now(),true);
      update businesses set subscription_plan_key='business',offer_id='00000000-0000-0000-0000-000000000301' where id='${A}'`),{transaction:false});
    e=env('incompatible-history'); await receive(e); before=await footprint();
    await apply(e,snapshot(),await revision(),'BLOCKED'); assert.equal(await footprint(),before); assertions++;
    await check(`select reason='APPLY_FAILED' and completed_at is null from saas_billing_events where event_id='incompatible-history'`, 'historical constraint fails closed without coercion');
  }
  return { assertions, overlay, scope:'Synthetic database proofs only; no hosted/provider acceptance' };
}
