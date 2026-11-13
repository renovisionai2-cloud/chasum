// Catalog observations only. Setup/refusal cases remain owned by the runner.
const v2Names = ['revise_booking_notes_v2', 'transition_booking_appointment_v2',
  'revise_booking_schedule_v2', 'read_booking_appointment_mutation_v2', 'close_booking_appointment_v2'];

export const negativeBaselineSql = `select jsonb_build_object(
 'roles',(select jsonb_agg(to_jsonb(r) order by oid) from pg_roles r),
 'memberships',(select jsonb_agg(to_jsonb(m) order by roleid,member,grantor) from pg_auth_members m),
 'table_acls',(select jsonb_agg(jsonb_build_object('oid',oid,'acl',relacl) order by oid) from pg_class where oid in ('public.appointments'::regclass,'public.appointment_resources'::regclass)),
 'triggers',(select jsonb_agg(jsonb_build_object('oid',oid,'table',tgrelid::regclass::text,'name',tgname,'enabled',tgenabled,'definition',pg_get_triggerdef(oid)) order by oid) from pg_trigger where tgrelid in ('public.appointments'::regclass,'public.appointment_resources'::regclass)),
 'parameter_acls',(select jsonb_agg(to_jsonb(p) order by oid) from pg_parameter_acl p),
 'parameter_effective',(select jsonb_agg(jsonb_build_object('role',rolname,'set',has_parameter_privilege(oid,'session_replication_role','SET'),'alter_system',has_parameter_privilege(oid,'session_replication_role','ALTER SYSTEM')) order by rolname) from pg_roles where rolname in ('anon','authenticated','authenticator','service_role'))
);`;

export const rollbackWitnessSql = `select jsonb_build_object(
 'database',current_database(),'session_user',session_user,'current_user',current_user,
 'backend_pid',pg_backend_pid(),'data_directory',current_setting('data_directory'),
 'server_addr',inet_server_addr(),'listen',current_setting('listen_addresses'),
 'journal_schema',to_regnamespace('booking_lifecycle_private'),
 'journal_relation',to_regclass('booking_lifecycle_private.appointment_mutations'),
 'revision_columns',(select count(*) from pg_attribute where attrelid='public.appointments'::regclass and attname='operational_revision' and not attisdropped),
 'v2_objects',(select coalesce(jsonb_agg(p.oid::regprocedure::text order by p.oid),'[]'::jsonb) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in (${v2Names.map(n=>`'${n}'`).join(',')})),
 'private_objects',(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='booking_lifecycle_private'),
 'guard_enabled',(select tgenabled from pg_trigger where tgrelid='public.appointments'::regclass and tgname='appointments_booking_operation_guard'),
 'parameter_set',has_parameter_privilege('service_role','session_replication_role','SET')
);`;

export function capabilityPreimageSql(name) {
 // Names are the runner's fixed case identifiers, never user/catalog input.
 const direct = /^unsafe-(anon|authenticated|authenticator|service_role|public)-(appointments|appointment_resources)-(truncate|trigger)$/.exec(name);
 const chain = /^unsafe-(anon|authenticator)-(inherited|set-role)-(truncate|trigger)$/.exec(name);
 if (!direct && !chain) throw new Error('Unknown capability case: '+name);
 const principal = direct ? (direct[1]==='public'?'service_role':direct[1]) : chain[1];
 const mode = direct ? (direct[1]==='public'?'public':'direct') : chain[2];
 const table = direct ? direct[2] : 'appointment_resources';
 const privilege = (direct ? direct[3] : chain[3]).toUpperCase();
 const grantee = mode==='public'?'0':`'${chain?'d1_capability_leaf':principal}'::regrole::oid`;
 const capability = `has_table_privilege('${principal}','public.${table}','${privilege}')`;
 const leaf = chain ? `has_table_privilege('d1_capability_leaf','public.${table}','${privilege}')` : 'null::boolean';
 const reachable = chain ? `pg_has_role('${principal}','d1_capability_leaf','SET')` : 'null::boolean';
 const inherited = chain ? `pg_has_role('${principal}','d1_capability_leaf','USAGE')` : 'null::boolean';
 const acl = `(select coalesce(jsonb_agg(to_jsonb(a) order by a.grantor,a.grantee,a.privilege_type),'[]'::jsonb) from pg_class c cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a where c.oid='public.${table}'::regclass and a.grantee=${grantee} and a.privilege_type='${privilege}')`;
 const assertion = `${acl}<>'[]'::jsonb and ${mode==='set-role'?`${leaf} and ${reachable} and not ${capability} and not ${inherited}`:capability}${mode==='inherited'?` and ${leaf} and ${inherited} and not ${reachable}`:''}`;
 return `select 'CAPABILITY_PREIMAGE:' || jsonb_build_object(
 'case','${name}','mode','${mode}','principal','${principal}','table','public.${table}','privilege','${privilege}',
 'session_user',session_user,'current_user',current_user,'backend_pid',pg_backend_pid(),'transaction_id',pg_current_xact_id()::text,
 'database',current_database(),'data_directory',current_setting('data_directory'),'server_addr',inet_server_addr(),
 'effective_privilege',${capability},'leaf_effective_privilege',${leaf},'set_reachable',${reachable},'inherit_reachable',${inherited},
 'acl',${acl},'membership_chain',(select coalesce(jsonb_agg(jsonb_build_object('role',r.rolname,'member',m.rolname,'inherit_option',a.inherit_option,'set_option',a.set_option,'admin_option',a.admin_option) order by r.rolname,m.rolname),'[]'::jsonb) from pg_auth_members a join pg_roles r on r.oid=a.roleid join pg_roles m on m.oid=a.member where r.rolname in ('d1_capability_leaf','d1_capability_bridge')),
 'assertion',(${assertion}))::text;
 do $capability$ begin if not (${assertion}) then raise exception 'CAPABILITY_PREIMAGE_NOT_ESTABLISHED'; end if; end $capability$;
 `;
}

export function parseCapabilityPreimage(output, name, data, user) {
 const lines=output.split('\n').filter(x=>x.startsWith('CAPABILITY_PREIMAGE:'));
 if(lines.length!==1)throw new Error('Missing/ambiguous capability preimage: '+name);
 const p=JSON.parse(lines[0].slice('CAPABILITY_PREIMAGE:'.length));
 if(p.case!==name||p.assertion!==true||p.database!=='d1_assertion_rollback'||p.data_directory!==data||p.server_addr!==null||p.session_user!==user||p.current_user!==user||p.acl.length!==1)throw new Error('Invalid capability preimage: '+name);
 if(p.mode==='public'&&p.acl[0].grantee!==0&&p.acl[0].grantee!=="0")throw new Error('PUBLIC is not ACL grantee zero');
 if(['inherited','set-role'].includes(p.mode)) {
  const edges=p.membership_chain;
  if(edges.length!==2||!edges.some(e=>e.role==='d1_capability_leaf'&&e.member==='d1_capability_bridge')||!edges.some(e=>e.role==='d1_capability_bridge'&&e.member===p.principal)||edges.some(e=>e.inherit_option!==(p.mode==='inherited')||e.set_option!==(p.mode==='set-role'))||p.leaf_effective_privilege!==true)throw new Error('Wrong membership witness: '+name);
 }
 if(p.mode==='set-role' ? (p.effective_privilege!==false||p.set_reachable!==true||p.inherit_reachable!==false) : p.effective_privilege!==true)throw new Error('Dangerous capability not witnessed: '+name);
 return p;
}

export function verifyRollbackWitness(r, data, user) {
 if(r.database!=='d1_assertion_rollback'||r.data_directory!==data||r.server_addr!==null||r.listen!==''||r.session_user!==user||r.current_user!==user||r.journal_schema!==null||r.journal_relation!==null||r.revision_columns!==0||r.v2_objects.length!==0||r.private_objects!==0||r.guard_enabled!=='O'||r.parameter_set!==false)throw new Error('Negative rollback/isolation witness failed');
}
