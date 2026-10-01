import "server-only";
import { Resend } from "resend";
import { evaluateEmailPolicy } from "./email-policy";

type SendArgs = Parameters<Resend["emails"]["send"]>;
type SendResult = Awaited<ReturnType<Resend["emails"]["send"]>>;

function recipientsOf(payload: SendArgs[0]): string[] {
  const asList = (value: unknown): string[] => (Array.isArray(value) ? (value as string[]) : value ? [value as string] : []);
  const p = payload as { to?: unknown; cc?: unknown; bcc?: unknown };
  return [...asList(p.to), ...asList(p.cc), ...asList(p.bcc)];
}

/**
 * The ONLY way application code sends email. A drop-in for `new Resend(key)`:
 * same `emails.send(...)` call and the same `{ data, error }` result, but every
 * message first passes the environment's email policy (see email-policy.ts).
 * A blocked message never reaches the provider and comes back as an error, so
 * existing callers treat it exactly like a provider failure.
 */
export function createResend(apiKey: string | undefined = process.env.RESEND_API_KEY) {
  let client: Resend | null = null;
  return {
    emails: {
      async send(payload: SendArgs[0], options?: SendArgs[1]): Promise<SendResult> {
        const decision = evaluateEmailPolicy(recipientsOf(payload));
        if (!decision.allowed) {
          console.error(`Email not sent: ${decision.reason}`);
          return { data: null, error: { name: "application_error", message: decision.reason, statusCode: 403 } } as unknown as SendResult;
        }
        client ??= new Resend(apiKey);
        return client.emails.send(payload, options);
      },
    },
  };
}
