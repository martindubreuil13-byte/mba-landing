import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
export default defineConfig({
  root,
  resolve: { alias: { "@": root.replace(/\/$/, ""), "server-only": fileURLToPath(new URL("./server-only-stub.ts", import.meta.url)) } },
});
