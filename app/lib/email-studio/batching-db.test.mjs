import { it } from "vitest";
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const repo=process.cwd();
it("stores unrestricted campaigns and atomically claims and completes non-overlapping batches of 25", async () => {
const db=new PGlite();
try {
await db.exec('create role anon; create role authenticated; create role service_role;');
const base=readFileSync(repo+'/supabase/migrations/20261114095857_email_campaigns.sql','utf8').split('create function public.suppress_newsletter_recipient')[0];
await db.exec(base);
await db.exec(`alter table public.email_campaigns add column intelligence_started_at timestamptz,
 add column exceptions_acknowledged_by uuid,
 add column has_consent_exceptions boolean generated always as (jsonb_path_exists(recipients, '$[*].exception')) stored;`);
const admin='11111111-1111-4111-8111-111111111111';
const recipients=Array.from({length:41},(_,i)=>({id:`22222222-2222-4222-8222-${String(i).padStart(12,'0')}`,email:`synthetic${i}@example.com`}));
async function create(list=recipients,created='now()',started='null') {
 return (await db.query(`insert into public.email_campaigns(subject,preview_text,body_html,body_text,selected_count,exclusions,recipients,created_at,started_at) values('Synthetic campaign','','<p>Test</p>','Test',$1,'{}',$2,${created},${started}) returning id`,[list.length,JSON.stringify(list)])).rows[0].id;
}
await assert.rejects(()=>create(),/email_campaigns_recipients_check/);
const migrations=readdirSync(repo+'/supabase/migrations').filter(name=>name.endsWith('_newsletter_campaign_batches.sql'));
assert.equal(migrations.length,1);
await db.exec(readFileSync(repo+'/supabase/migrations/'+migrations[0],'utf8'));
const id=await create();
async function claim(id,offset,ack=false) {return (await db.query('select public.claim_email_campaign_batch($1,$2,$3,$4) as result',[id,offset,admin,ack])).rows[0].result;}
async function finish(id,token) {return (await db.query('select public.complete_email_campaign_batch($1,$2) as result',[id,token])).rows[0].result;}
async function record(id,items,status='sent') {for(const r of items)await db.query('insert into public.email_campaign_deliveries(campaign_id,lead_id,email,status) values($1,$2,$3,$4)',[id,r.id,r.email,status]);}
assert.equal(await claim(id,25),null,'cannot skip first batch');
const first=await claim(id,0); assert.equal(first.recipients.length,25);
assert.equal(await claim(id,0),null,'cannot double-claim active batch');
assert.equal(await claim(id,25),null,'cannot overlap batches');
assert.equal(await finish(id,admin),null,'wrong claim token cannot finish');
assert.equal(await finish(id,first.claimToken),null,'unrecorded batch cannot advance');
await record(id,first.recipients.slice(0,24));
await record(id,first.recipients.slice(24),'attempting');
assert.equal(await finish(id,first.claimToken),null,'attempting delivery blocks advancement');
await db.query("update public.email_campaign_deliveries set status='unknown' where campaign_id=$1 and status='attempting'",[id]);
assert.deepEqual(await finish(id,first.claimToken),{nextOffset:25,done:false});
assert.equal(await finish(id,first.claimToken),null,'cannot finish token twice');
assert.equal(await claim(id,0),null,'cannot replay completed first batch');
const second=await claim(id,25);assert.equal(second.recipients.length,16);
assert.equal(new Set([...first.recipients,...second.recipients].map(r=>r.id)).size,41);
await record(id,second.recipients,'excluded');
assert.deepEqual(await finish(id,second.claimToken),{nextOffset:41,done:true});
assert.equal(await claim(id,25),null,'completed campaign cannot restart');
const exceptionId=await create([{...recipients[0],exception:{reason:'Synthetic permission'}}]);
assert.equal(await claim(exceptionId,0),null,'exception acknowledgment still required');
assert.ok(await claim(exceptionId,0,true));
const expiredId=await create([recipients[0]],"now()-interval '31 minutes'");
assert.equal(await claim(expiredId,0),null,'expired review cannot start');
const legacyId=await create([recipients[0]],'now()','now()');
assert.equal(await claim(legacyId,0),null,'legacy interrupted campaign cannot replay');
const largeId=await create(Array.from({length:1100},(_,i)=>({...recipients[0],email:`large${i}@example.com`})));
assert.ok(largeId,'no arbitrary campaign recipient cap');
await db.exec('set role anon');
await assert.rejects(()=>claim(id,0),/permission denied/);
await db.exec('reset role');
} finally { await db.close(); }
}, 20_000);
