import { it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const repo = process.cwd();
const sql = (name) => readFileSync(`${repo}/supabase/migrations/${name}`, "utf8");

/**
 * Runs the real SQL of the individual-outreach migration in an in-memory Postgres (no network, no Supabase, no production).
 * The older campaign tables are rebuilt from their own migration files the same way batching-db.test.mjs does.
 */
it("makes an individual send a one-recipient campaign that can be claimed only once, and stores drafts safely", async () => {
  const db = new PGlite();
  try {
    // Supabase's service_role bypasses row security; the others do not.
    await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
    await db.exec("create table public.leads (id uuid primary key default gen_random_uuid(), email text not null);");
    await db.exec(sql("20261114095857_email_campaigns.sql").split("create function public.suppress_newsletter_recipient")[0]);
    await db.exec(`alter table public.email_campaigns add column intelligence_started_at timestamptz,
      add column exceptions_acknowledged_by uuid,
      add column has_consent_exceptions boolean generated always as (jsonb_path_exists(recipients, '$[*].exception')) stored;`);
    await db.exec(sql("20261122081131_newsletter_campaign_batches.sql"));
    await db.exec(sql("20261124040000_individual_outreach.sql"));

    const admin = "11111111-1111-4111-8111-111111111111";
    const person = { id: "22222222-2222-4222-8222-000000000001", email: "prospect@example.com" };
    const insertCampaign = async (list, kind) => (await db.query(
      `insert into public.email_campaigns(subject,preview_text,body_html,body_text,selected_count,exclusions,recipients${kind ? ",kind" : ""})
       values('Hello','','<p>Hi</p>','Hi',$1,'{}',$2${kind ? ",$3" : ""}) returning id, kind`,
      kind ? [list.length, JSON.stringify(list), kind] : [list.length, JSON.stringify(list)])).rows[0];

    // Newsletters are unchanged: the default kind, and many recipients are still allowed.
    const newsletter = await insertCampaign(Array.from({ length: 60 }, (_, i) => ({ id: person.id, email: `n${i}@example.com` })));
    assert.equal(newsletter.kind, "newsletter");
    await assert.rejects(() => insertCampaign([person], "other"), /email_campaigns_kind_check/);

    // Outreach is exactly one recipient, enforced by the database.
    await assert.rejects(() => insertCampaign([person, { ...person, email: "second@example.com" }], "outreach"), /email_campaigns_outreach_single_recipient/);
    const outreach = await insertCampaign([person], "outreach");
    assert.equal(outreach.kind, "outreach");

    // The existing atomic claim sends it once: no second claim, no replay after completion.
    const claim = async (id, offset) => (await db.query("select public.claim_email_campaign_batch($1,$2,$3,false) as r", [id, offset, admin])).rows[0].r;
    const finish = async (id, token) => (await db.query("select public.complete_email_campaign_batch($1,$2) as r", [id, token])).rows[0].r;
    const first = await claim(outreach.id, 0);
    assert.equal(first.recipients.length, 1);
    assert.equal(await claim(outreach.id, 0), null, "a second claim while sending is refused");
    await db.query("insert into public.email_campaign_deliveries(campaign_id,lead_id,email,status) values($1,$2,$3,'sent')", [outreach.id, person.id, person.email]);
    assert.deepEqual(await finish(outreach.id, first.claimToken), { nextOffset: 1, done: true });
    assert.equal(await claim(outreach.id, 0), null, "a sent individual email cannot be replayed");

    // Drafts: defaults, limits, and the links to contacts and campaigns.
    const draft = (await db.query("insert into public.email_outreach_drafts(recipient_email) values('a@example.com') returning *")).rows[0];
    assert.deepEqual([draft.recipient_name, draft.subject, draft.preview_text, draft.editor_operations, draft.campaign_id], ["", "", "", [], null]);
    await assert.rejects(() => db.query("insert into public.email_outreach_drafts(subject) values($1)", ["x".repeat(181)]), /email_outreach_drafts_subject_check/);
    await assert.rejects(() => db.query("insert into public.email_outreach_drafts(recipient_email) values($1)", ["x".repeat(255)]), /recipient_email_check/);
    await assert.rejects(() => db.query("insert into public.email_outreach_drafts(editor_operations) values('{}')"), /editor_operations_check/);
    await assert.rejects(() => db.query("insert into public.email_outreach_drafts(campaign_id) values($1)", ["33333333-3333-4333-8333-333333333333"]), /foreign key/);
    // Erasing a contact leaves the draft (which the admin can delete) but clears the link.
    await db.query("insert into public.leads(id,email) values($1,$2)", [person.id, person.email]);
    await db.query("update public.email_outreach_drafts set lead_id=$1, campaign_id=$2 where id=$3", [person.id, outreach.id, draft.id]);
    await db.query("delete from public.leads where id=$1", [person.id]);
    assert.equal((await db.query("select lead_id from public.email_outreach_drafts where id=$1", [draft.id])).rows[0].lead_id, null);

    // Only the service role can touch drafts.
    await db.exec("set role anon");
    await assert.rejects(() => db.query("select * from public.email_outreach_drafts"), /permission denied/);
    await assert.rejects(() => db.query("insert into public.email_outreach_drafts(recipient_email) values('x@example.com')"), /permission denied/);
    await db.exec("reset role");
    await db.exec("set role service_role");
    assert.equal((await db.query("select count(*)::int as n from public.email_outreach_drafts")).rows[0].n, 1);
    await db.query("delete from public.email_outreach_drafts where id=$1", [draft.id]);
    await db.exec("reset role");
  } finally { await db.close(); }
}, 20_000);
