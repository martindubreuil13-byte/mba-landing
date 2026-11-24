import { it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import assert from "node:assert/strict";

const repo = process.cwd();
const sql = (name) => readFileSync(`${repo}/supabase/migrations/${name}`, "utf8");
// Found by name: production stamps its own version on a migration when it is applied, so the file name's version prefix is not fixed.
const outreachMigration = readdirSync(`${repo}/supabase/migrations`).filter((name) => name.endsWith("_individual_outreach.sql")).sort().at(-1);

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

    // Compatibility with code that is already deployed: ONE long-lived session (like a pooled connection) uses the claim and completion functions on a
    // newsletter BEFORE the migration, the migration is applied, and the same session keeps using them AFTER it, with no error and the same results.
    const newsletterRecipients = (n) => Array.from({ length: n }, (_, i) => ({ id: "44444444-4444-4444-8444-0000000000" + String(10 + i), email: `news${i}@example.com` }));
    const newNewsletter = async (n) => (await db.query(
      `insert into public.email_campaigns(subject,preview_text,body_html,body_text,selected_count,exclusions,recipients) values('News','','<p>x</p>','x',$1,'{}',$2) returning id`,
      [n, JSON.stringify(newsletterRecipients(n))])).rows[0].id;
    const adminId = "11111111-1111-4111-8111-111111111111";
    const claimNews = async (id, offset) => (await db.query("select public.claim_email_campaign_batch($1,$2,$3,false) as r", [id, offset, adminId])).rows[0].r;
    const finishNews = async (id, token) => (await db.query("select public.complete_email_campaign_batch($1,$2) as r", [id, token])).rows[0].r;
    const markDelivered = async (id, rows) => { for (const r of rows) await db.query("insert into public.email_campaign_deliveries(campaign_id,lead_id,email,status) values($1,$2,$3,'sent')", [id, r.id, r.email]); };
    const before = await newNewsletter(30);
    const b1 = await claimNews(before, 0);
    assert.equal(b1.recipients.length, 25);
    await markDelivered(before, b1.recipients);
    assert.deepEqual(await finishNews(before, b1.claimToken), { nextOffset: 25, done: false });

    await db.exec(sql(outreachMigration));

    const b2 = await claimNews(before, 25);                       // the half-sent newsletter carries on in the same session
    assert.equal(b2.recipients.length, 5);
    await markDelivered(before, b2.recipients);
    assert.deepEqual(await finishNews(before, b2.claimToken), { nextOffset: 30, done: true });
    const after = await newNewsletter(3);                          // and a brand-new newsletter, inserted exactly as the deployed code does (no kind column)
    assert.equal((await db.query("select kind from public.email_campaigns where id=$1", [after])).rows[0].kind, "newsletter");
    const a1 = await claimNews(after, 0);
    assert.equal(a1.recipients.length, 3);
    assert.equal((await db.query("select kind from public.email_campaigns where id=$1", [before])).rows[0].kind, "newsletter", "an existing campaign became a newsletter");
    // The runbook's pre-check "is a newsletter being sent right now?" is valid SQL on this schema and sees the newsletter claimed above but not finished (1)...
    assert.equal((await db.query("select count(*)::int as sending_now from public.email_campaigns where send_claim is not null and completed_at is null")).rows[0].sending_now, 1);
    // ...and sees 0 once it is finished.
    await markDelivered(after, a1.recipients);
    assert.deepEqual(await finishNews(after, a1.claimToken), { nextOffset: 3, done: true });
    assert.equal((await db.query("select count(*)::int as sending_now from public.email_campaigns where send_claim is not null and completed_at is null")).rows[0].sending_now, 0);

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

    // One send per draft: a second review of the same draft voids the first, and a claimed review finishes the draft.
    const review = async () => (await db.query(
      `insert into public.email_campaigns(subject,preview_text,body_html,body_text,selected_count,exclusions,recipients,kind) values('S','','<p>x</p>','x',1,'{}',$1,'outreach') returning id`,
      [JSON.stringify([person])])).rows[0].id;
    const attach = async (draftId, campaign) => (await db.query("select public.attach_outreach_review($1,$2) as r", [draftId, campaign])).rows[0].r;
    const fresh = (await db.query("insert into public.email_outreach_drafts(recipient_email) values('b@example.com') returning id")).rows[0].id;
    const tab1 = await review();
    assert.equal(await attach(fresh, tab1), true, "first review attaches");
    assert.equal(await attach(fresh, tab1), true, "attaching the same review again changes nothing");
    const tab2 = await review();
    assert.equal(await attach(fresh, tab2), true, "a newer review attaches");
    assert.equal(await claim(tab1, 0), null, "the older, unsent review is voided: tab 1 can no longer send");
    assert.equal((await db.query("select campaign_id from public.email_outreach_drafts where id=$1", [fresh])).rows[0].campaign_id, tab2);
    const sentTab2 = await claim(tab2, 0);
    assert.ok(sentTab2, "the newest review is the one that can be sent");
    const tab3 = await review();
    assert.equal(await attach(fresh, tab3), false, "once a review was claimed for sending the draft is finished");
    assert.equal(await claim(tab3, 0), null, "and the new review is voided, so nothing further can be sent");
    assert.equal((await db.query("select campaign_id from public.email_outreach_drafts where id=$1", [fresh])).rows[0].campaign_id, tab2, "the draft still points at the review that was sent");
    const orphan = await review();
    assert.equal(await attach("33333333-3333-4333-8333-333333333333", orphan), false, "no draft, no live review");
    assert.equal(await claim(orphan, 0), null);
    // Voided reviews never reach history (history lists only started campaigns) and keep their content for audit.
    assert.equal((await db.query("select count(*)::int as n from public.email_campaigns where id = any($1) and started_at is null and completed_at is not null", [[tab1, tab3, orphan]])).rows[0].n, 3);
    await db.exec("set role anon");
    await assert.rejects(() => attach(fresh, tab1), /permission denied/);
    await db.exec("reset role");

    // Only the service role can touch drafts.
    await db.exec("set role anon");
    await assert.rejects(() => db.query("select * from public.email_outreach_drafts"), /permission denied/);
    await assert.rejects(() => db.query("insert into public.email_outreach_drafts(recipient_email) values('x@example.com')"), /permission denied/);
    await db.exec("reset role");
    await db.exec("set role service_role");
    assert.equal((await db.query("select count(*)::int as n from public.email_outreach_drafts")).rows[0].n, 2);
    await db.query("delete from public.email_outreach_drafts where id=$1", [draft.id]);
    await db.exec("reset role");
  } finally { await db.close(); }
}, 20_000);
