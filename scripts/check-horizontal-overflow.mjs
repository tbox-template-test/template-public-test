import { createServer } from "node:http";
import { readFile, stat, readdir } from "node:fs/promises";
import { extname, join, normalize, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

// fileURLToPath, not URL.pathname: on Windows .pathname gives "/C:/...",
// which resolves to the invalid path "\C:\..." and every read fails.
const root = fileURLToPath(new URL("../dist/", import.meta.url));
const widths = [320, 360, 390, 414];
const host = "127.0.0.1";
const port = 4177;

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".avif", "image/avif"],
  [".ico", "image/x-icon"],
  [".woff2", "font/woff2"],
]);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else out.push(full);
  }
  return out;
}

function routeFor(file) {
  const rel = relative(root, file).replaceAll("\\", "/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return "/" + rel.slice(0, -"index.html".length);
  return "/" + rel;
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const cleaned = normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, "");
  return join(root, cleaned);
}

const server = createServer(async (req, res) => {
  try {
    let file = safePath(req.url || "/");
    let info;
    try {
      info = await stat(file);
    } catch {
      info = null;
    }

    if (info?.isDirectory()) file = join(file, "index.html");
    if (!info && !extname(file)) file = join(file, "index.html");

    const data = await readFile(file);
    res.writeHead(200, {
      "content-type": types.get(extname(file)) || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

await new Promise((resolve) => server.listen(port, host, resolve));

const htmlFiles = (await walk(root)).filter((file) => file.endsWith(".html"));
const routes = htmlFiles.map(routeFor);
const browser = await chromium.launch({ headless: true });
const failures = [];

function fmt(n) {
  return Math.round(n * 10) / 10;
}

for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  for (const route of routes) {
    const url = `http://${host}:${port}${route}`;
    const response = await page.goto(url, { waitUntil: "networkidle" });

    if (!response || !response.ok()) {
      failures.push({ route, width, reason: `HTTP ${response?.status() ?? "no response"}` });
      continue;
    }

    const result = await page.evaluate(() => {
      const doc = document.documentElement;
      const viewport = doc.clientWidth;
      const scrollWidth = Math.max(doc.scrollWidth, document.body?.scrollWidth || 0);
      const overflow = scrollWidth - viewport;

      if (overflow <= 1) return { overflow, offenders: [] };

      // An element offends in one of two ways: its own box sits outside the
      // viewport, or its box fits but its content spills out of it (the usual
      // white-space:nowrap case, where the box is fine and only the text is not).
      const candidates = [...document.querySelectorAll("body *")]
        .map((el) => {
          const r = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          const spills = style.overflowX === "visible" && el.scrollWidth > el.clientWidth + 1;
          const contentRight = spills ? r.left + el.scrollWidth : r.right;
          return {
            el,
            tag: el.tagName.toLowerCase(),
            id: el.id || "",
            classes: typeof el.className === "string" ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 3) : [],
            left: r.left,
            right: r.right,
            width: r.width,
            contentRight,
            spills,
            position: style.position,
            overflowX: style.overflowX,
            whiteSpace: style.whiteSpace,
            excess: Math.max(contentRight - viewport, -r.left),
          };
        })
        .filter((x) => x.width > 1 && (x.left < -1 || x.contentRight > viewport + 1));

      // Content overflow propagates to every ancestor's scrollWidth. Report the
      // deepest element responsible, not each wrapper around it.
      const offenders = candidates
        .filter((x) => !candidates.some((y) => y !== x && x.el.contains(y.el) && y.excess >= x.excess - 1))
        .sort((a, b) => b.excess - a.excess)
        .slice(0, 12)
        .map(({ el, excess, ...rest }) => rest);

      return { overflow, offenders };
    });

    if (result.overflow > 1) {
      failures.push({ route, width, ...result });
    }
  }

  await context.close();
}

await browser.close();
await new Promise((resolve) => server.close(resolve));

if (failures.length) {
  console.error("\nHorizontal overflow standard FAILED.\n");
  for (const f of failures) {
    console.error(`- ${f.route} @ ${f.width}px: ${fmt(f.overflow || 0)}px overflow${f.reason ? ` (${f.reason})` : ""}`);
    for (const o of f.offenders || []) {
      const selector = `${o.tag}${o.id ? "#" + o.id : ""}${o.classes?.length ? "." + o.classes.join(".") : ""}`;
      const spill = o.spills ? ` content-right=${fmt(o.contentRight)} (content spills out of its box)` : "";
      console.error(`    ${selector} left=${fmt(o.left)} right=${fmt(o.right)} width=${fmt(o.width)}${spill} position=${o.position} white-space=${o.whiteSpace}`);
    }
    if (f.overflow > 1 && !f.offenders?.length) {
      console.error("    (no single element identified — inspect the page at this width in devtools)");
    }
  }
  console.error("\nFix the offending layout. Check white-space:nowrap first. Remember that scrollIntoView() also scrolls horizontally, so fix page overflow before changing scroll code. Do not hide the failure with global overflow clipping.\n");
  process.exit(1);
}

console.log(`Responsive overflow standard passed: ${routes.length} routes x ${widths.length} phone widths.`);
