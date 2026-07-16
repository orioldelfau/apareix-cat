import { getBlogPosts } from "@/lib/blog";
import { site } from "@/lib/site";

export function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Blog Apareix</title>
    <link>${site.url}/blog</link>
    <description>Google Maps i SEO local per restaurants.</description>
${getBlogPosts()
  .map(
    (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${site.url}/blog/posts/${post.slug}</link>
      <guid>${site.url}/blog/posts/${post.slug}</guid>
      <pubDate>${new Date(`${post.date}T08:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" }
  });
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
