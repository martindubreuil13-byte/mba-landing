"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getServiceClient } from "@/app/lib/supabase/service";

const name = z.string().trim().min(1).max(80);
const mutation = z.discriminatedUnion("op", [
  z.object({ op: z.literal("create"), name, search_query: z.string().trim().max(254), tag_ids: z.array(z.uuid()).max(1000) }),
  z.object({ op: z.literal("update"), id: z.uuid(), search_query: z.string().trim().max(254), tag_ids: z.array(z.uuid()).max(1000) }),
  z.object({ op: z.literal("rename"), id: z.uuid(), name }),
  z.object({ op: z.literal("delete"), id: z.uuid() }),
]);

export async function mutateAudience(input: unknown) {
  await requireAdmin();
  const parsed = mutation.safeParse(input);
  if (!parsed.success) return { error: "Check the audience name and filters, then try again." };
  const change = parsed.data;
  const table = getServiceClient().from("email_saved_audiences");
  const query = change.op === "create"
    ? table.insert({ name: change.name, search_query: change.search_query, tag_ids: [...new Set(change.tag_ids)] })
    : change.op === "update"
      ? table.update({ search_query: change.search_query, tag_ids: [...new Set(change.tag_ids)] }).eq("id", change.id)
      : change.op === "rename"
        ? table.update({ name: change.name }).eq("id", change.id)
        : table.delete().eq("id", change.id);
  const { data, error } = await query.select("id").maybeSingle();
  if (error || !data) return { error: "The audience could not be saved. Reload and try again." };
  revalidatePath("/admin/email");
  return { id: data.id as string };
}
