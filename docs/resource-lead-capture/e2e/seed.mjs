import { createClient } from "/Users/martin/Documents/The Modern Business Architect (MBA)/mba-site/node_modules/@supabase/supabase-js/dist/index.mjs";
import fs from "node:fs";
const sb = createClient(process.env.API_URL, process.env.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const dir = "/Users/martin/Documents/The Modern Business Architect (MBA)/Lead Magnets/";
const pdf = fs.readFileSync(dir + "Build-the-Bridge-First-FINAL-corrected.pdf");
const cover = fs.readFileSync(dir + "Cover4.png");
await sb.storage.from("resource-files").upload("build-the-bridge-first/Build-the-Bridge-First-FINAL.pdf", pdf, { contentType: "application/pdf", upsert: true });
await sb.storage.from("resource-covers").upload("build-the-bridge-first/Cover4.png", cover, { contentType: "image/png", upsert: true });
const long = `You have built a successful career. You may have years of expertise, commercial judgment and professional relationships—but that does not automatically tell you what business to start or whether entrepreneurship is the right next move.\r\n\r\nBuild the Bridge First is a practical, self-guided workbook for experienced corporate professionals considering entrepreneurship, business ownership or a second career as a founder.\r\n\r\nIn approximately 30 minutes, the guide helps you:\r\n\r\n- clarify what you want entrepreneurship to change in your life;\r\n- understand the role your future business would create for you;\r\n- separate your personal expertise and relationships from the resources your employer provided;\r\n- choose a type and size of business that fits your financial ambitions and desired lifestyle;\r\n- identify customers and problems you may be unusually well positioned to understand;\r\n- distinguish a promising business opportunity from an attractive but untested idea;\r\n- separate what you know from what you are merely assuming;\r\n- choose the next piece of evidence to seek before investing heavily or leaving your job.\r\n\r\nYou will finish with an Entrepreneurial Direction Brief: a concise summary of the future you want, the founder role that fits you, your portable advantages, a potential opportunity territory and one clear next step.\r\n\r\nThe guide will not give you a list of fashionable business ideas or tell you to quit your job and follow your passion. It will help you think more clearly, reduce unnecessary risk and build the bridge from corporate experience to entrepreneurship—before you jump.`;
const { error } = await sb.from("resources").upsert({
  slug: "build-the-bridge-first", title: "Build The Bridge First", resource_type: "Guide",
  audience: "Aspiring entrepreneurs, First time founders",
  short_description: "A practical 30-minute guide for experienced corporate professionals considering entrepreneurship. Clarify what you want from business ownership, identify the experience and advantages you can carry with you, find a credible business direction and decide what to test before taking a significant risk.",
  long_description: long, file_path: "build-the-bridge-first/Build-the-Bridge-First-FINAL.pdf", file_name: "Build-the-Bridge-First-FINAL.pdf",
  cover_image_path: "build-the-bridge-first/Cover4.png", published: true,
}, { onConflict: "slug" });
console.log("resource", error ?? "ok");
// admin user for local admin testing only; the password comes from the environment and is never stored in the repo
if (!process.env.LOCAL_ADMIN_PASSWORD) throw new Error("Set LOCAL_ADMIN_PASSWORD (a throwaway value for the LOCAL admin user).");
const email = process.env.ADMIN_EMAIL;
const { error: uerr } = await sb.auth.admin.createUser({ email, password: process.env.LOCAL_ADMIN_PASSWORD, email_confirm: true });
console.log("admin user", uerr?.message ?? "ok");

// an unconverted resource, to prove the old flow is untouched
await sb.storage.from("resource-files").upload("other-guide/other.pdf", Buffer.from("%PDF-1.1\n%%EOF\n"), { contentType: "application/pdf", upsert: true });
const { error: e2 } = await sb.from("resources").upsert({ slug: "other-guide", title: "Other Guide", resource_type: "Guide", short_description: "An unconverted guide.", file_path: "other-guide/other.pdf", file_name: "other.pdf", published: true }, { onConflict: "slug" });
console.log("other-guide", e2 ?? "ok");
