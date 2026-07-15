const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

const publicPaths = [
  "index.html",
  "styles.css",
  "blog.css",
  "blog",
  "assets",
  "robots.txt",
  "sitemap.xml",
  "rss.xml",
  "llms.txt",
  "llms-full.txt"
];

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

for (const relativePath of publicPaths) {
  copyPublicPath(path.join(ROOT, relativePath), path.join(DIST, relativePath));
}

console.log(`Public site built at ${DIST}`);

function copyPublicPath(source, destination) {
  if (!fs.existsSync(source)) {
    throw new Error(`Missing public path: ${path.relative(ROOT, source)}`);
  }

  const stats = fs.statSync(source);
  if (stats.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copyPublicPath(path.join(source, entry), path.join(destination, entry));
    }
    return;
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}
