import { getBlogPosts } from "@/lib/blog";
import { site } from "@/lib/site";

export function GET() {
  const urls: Array<{ loc: string; priority: string; lastmod?: string }> = [
    { loc: `${site.url}/`, priority: "1.0" },
    { loc: `${site.url}/blog`, priority: "0.8" },
    ...getBlogPosts().map((post) => ({
      loc: `${site.url}/blog/posts/${post.slug}`,
      lastmod: post.date,
      priority: "0.7"
    }))
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>${url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : ""}
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" }
  });
}
