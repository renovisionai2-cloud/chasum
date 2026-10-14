import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';

// Only the runner's already-verified private Unix socket and scrubbed environment.
export function sessionFactory({bin,conn,env,log}) {
 const sessions=[];
 function open(label) {
  const child=spawn(bin+'/psql',[...conn,'-At','-v','ON_ERROR_STOP=0'],{env,stdio:['pipe','pipe','pipe']});
  const pending=[],errorHistory=[];let buffer='',errors='',dead=false,closing=false;
  child.stdout.on('data',b=>{buffer+=b;drain();});
  child.stderr.on('data',b=>{errors+=b;errorHistory.push(String(b));log({kind:'session-stderr',label,at:new Date().toISOString(),text:String(b)});});
  child.on('exit',(code,signal)=>{dead=true;for(const p of pending.splice(0)){clearTimeout(p.timer);p.reject(new Error(label+' exited '+code+'/'+signal));}});
  function drain(){while(pending.length&&buffer.includes(pending[0].token)){
   const p=pending.shift(),pos=buffer.indexOf(p.token),out=buffer.slice(0,pos).trim();buffer=buffer.slice(pos+p.token.length).replace(/^\r?\n/,'');clearTimeout(p.timer);
   log({kind:'session-result',label,at:new Date().toISOString(),sequence:p.token,stdout:out,stderr:errors});errors='';p.resolve(out);
  }}
  function exec(text){if(dead)return Promise.reject(new Error(label+' closed'));
   const token='DONE_'+randomUUID().replaceAll('-','');
   return new Promise((resolve,reject)=>{const p={token,resolve,reject,timer:setTimeout(()=>{child.kill('SIGTERM');reject(new Error(label+' request timeout'));},35000)};pending.push(p);log({kind:'session-dispatch',label,at:new Date().toISOString(),sequence:token,sql:text});child.stdin.write(text+'\n\\echo '+token+'\n');});
  }
  const s={label,exec,async abandon(){if(dead)return;closing=true;await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGKILL');});},errorText:()=>errorHistory.join(''),pid:null,async begin(){const x=await exec("begin; set local role service_role; select json_build_object('pid',pg_backend_pid(),'xid',pg_current_xact_id()::text,'role',current_user);");s.pid=JSON.parse(x.split('\n').find(l=>l.startsWith('{'))).pid;return s;},async end(){if(!dead&&!closing){closing=true;await exec('rollback;');child.stdin.end('\\q\n');}}};sessions.push(s);return s;
 }
 return {open,async close(){for(const s of sessions)await s.end();}};
}
