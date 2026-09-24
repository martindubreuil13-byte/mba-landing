const ORIGIN = "https://modernbusinessarchitect.com";
const HOST = "modernbusinessarchitect.com";
const KEY = "24ddce085d400ab33a7cf25782ee72d3";
const KEY_LOCATION = `${ORIGIN}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

const excludedPaths = new Set([
  "/contact",
  "/qualify",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
]);

function normalizeUrl(input) {
  // Fail closed on anything that looks like several URLs run together (for
  // example an unsplit shell variable) rather than submitting it verbatim.
  if (/\s/.test(input)) {
    throw new Error(`Argument contains whitespace; pass each URL separately: ${JSON.stringify(input)}`);
  }

  let url;

  if (input.startsWith("/")) {
    url = new URL(input, ORIGIN);
  } else {
    try {
      url = new URL(input);
    } catch {
      throw new Error(`Invalid path or URL: ${input}`);
    }
  }

  if (url.protocol !== "https:" || url.hostname !== HOST) {
    throw new Error(`Only ${ORIGIN} URLs are accepted: ${input}`);
  }

  if (url.port || url.username || url.password || url.search || url.hash) {
    throw new Error(`URL must be a canonical production URL without credentials, ports, queries, or fragments: ${input}`);
  }

  if (/%20|%09|%0a|%0d/i.test(url.pathname) || /\s/.test(decodeURIComponent(url.pathname))) {
    throw new Error(`URL path contains an encoded space or whitespace: ${input}`);
  }

  const path = url.pathname !== "/" ? url.pathname.replace(/\/+$/, "") : "/";

  if (
    path.startsWith("/api/") ||
    excludedPaths.has(path) ||
    path.endsWith(".txt") ||
    /^\/google[^/]*\.html$/i.test(path)
  ) {
    throw new Error(`Route is not eligible for IndexNow: ${path}`);
  }

  return new URL(path, ORIGIN).toString();
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const inputs = args.filter((arg) => arg !== "--dry-run");

if (inputs.length === 0) {
  console.error("Usage: npm run indexnow -- [--dry-run] /work [/martin ...]");
  process.exit(1);
}

let urlList;

try {
  urlList = [...new Set(inputs.map(normalizeUrl))];
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const payload = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList,
};

if (dryRun) {
  console.log("Dry run only — no IndexNow request was sent.");
  console.log(JSON.stringify({ endpoint: ENDPOINT, payload }, null, 2));
  process.exit(0);
}

const response = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
});

const responseBody = await response.text();
console.log(`IndexNow response: ${response.status} ${response.statusText}`);
if (responseBody) console.log(responseBody);

if (!response.ok) process.exit(1);

console.log("Notification accepted. Indexing is not guaranteed.");
