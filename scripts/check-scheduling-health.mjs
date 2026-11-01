// Read-only production monitor; no email, appointments or provider writes. Credentials come only from the environment.
const secret = process.env.SCHEDULING_RECOVERY_SECRET;
if (!secret) { console.error("SCHEDULING_RECOVERY_SECRET is required"); process.exit(2); }
try {
  const response = await fetch("https://modernbusinessarchitect.com/api/cron/scheduling-health", {
    headers: { authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(15000),
  });
  const data = await response.json().catch(() => null);
  console.log(JSON.stringify({ status: response.status, ...(data && typeof data.ok === "boolean" ? { ok: data.ok, checks: data.checks, attention: data.attention } : {}) }));
  process.exitCode = response.ok && data?.ok === true ? 0 : 1;
} catch { console.error("Scheduling health request failed"); process.exitCode = 1; }
