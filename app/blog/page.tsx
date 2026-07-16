import Link from "next/link";
import { formatDate, getBlogPosts } from "@/lib/blog";

export const metadata = {
  title: "Blog Apareix | Google Maps i SEO local per restaurants",
  description: "Articles practics sobre Google Maps, ressenyes, posts i SEO local per restaurants."
};

export default function BlogPage() {
  const posts = getBlogPosts();

  return (
    <main className="blog-page">
      <header className="site-header blog-header">
        <Link className="brand" href="/">
          <span className="brand-mark">A</span>
          <span>Apareix</span>
        </Link>
        <nav className="nav">
          <Link href="/#servei">Servei</Link>
          <Link href="/#preu">Preu</Link>
          <Link href="/login">Portal</Link>
        </nav>
      </header>

      <section className="blog-hero">
        <p className="eyebrow">Blog Apareix</p>
        <h1>Google Maps, ressenyes i SEO local per restaurants.</h1>
        <p>
          Guies pràctiques per restaurants que volen tenir una fitxa més activa, clara i orientada
          a generar accions locals.
        </p>
      </section>

      <section className="post-grid" aria-label="Articles del blog">
        {posts.map((post) => (
          <article className="post-card" key={post.slug}>
            <p className="eyebrow">
              {post.category} · {formatDate(post.date)}
            </p>
            <h2>
              <Link href={`/blog/posts/${post.slug}`}>{post.title}</Link>
            </h2>
            <p>{post.description}</p>
            <Link className="read-link" href={`/blog/posts/${post.slug}`}>
              Llegir article
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
