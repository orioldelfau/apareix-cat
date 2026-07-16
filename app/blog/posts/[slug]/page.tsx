import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getBlogPost, getBlogPosts } from "@/lib/blog";

export function generateStaticParams() {
  return getBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return {
    title: `${post.title} | Apareix`,
    description: post.description
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.date,
      author: { "@type": "Organization", name: "Apareix" },
      publisher: { "@type": "Organization", name: "Apareix" },
      keywords: post.keywords,
      about: post.entities.map((entity) => ({ "@type": "Thing", name: entity }))
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer }
      }))
    }
  ];

  return (
    <main className="blog-page">
      <header className="site-header blog-header">
        <Link className="brand" href="/">
          <span className="brand-mark">A</span>
          <span>Apareix</span>
        </Link>
        <nav className="nav">
          <Link href="/blog">Blog</Link>
          <Link href="/login">Portal</Link>
        </nav>
      </header>

      <article className="article">
        <header className="article-header">
          <Link className="back-link" href="/blog">
            Blog
          </Link>
          <p className="eyebrow">
            {post.category} · {formatDate(post.date)} · {post.readingMinutes} min
          </p>
          <h1>{post.title}</h1>
          <p>{post.intro}</p>
          <ul className="entity-list" aria-label="Entitats relacionades">
            {post.entities.map((entity) => (
              <li key={entity}>{entity}</li>
            ))}
          </ul>
        </header>

        <aside className="direct-answer">
          <h2>Resposta curta</h2>
          <p>{post.directAnswer}</p>
        </aside>

        {post.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </section>
        ))}

        <section className="faq-block">
          <h2>Preguntes freqüents</h2>
          {post.faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </section>

        <aside className="article-cta">
          <h2>Vols tenir Google Maps actiu cada setmana?</h2>
          <p>{post.cta}</p>
          <Link className="button primary" href="/login">
            Començar per 50 EUR/mes
          </Link>
        </aside>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </main>
  );
}
