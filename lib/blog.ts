import posts from "@/data/blog-posts.json";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  readingMinutes: number;
  keywords: string[];
  entities: string[];
  directAnswer: string;
  faqs: Array<{ question: string; answer: string }>;
  intro: string;
  sections: Array<{ heading: string; body: string }>;
  cta: string;
};

export function getBlogPosts() {
  return [...(posts as BlogPost[])].sort((a, b) => b.date.localeCompare(a.date));
}

export function getBlogPost(slug: string) {
  return getBlogPosts().find((post) => post.slug === slug);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("ca", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00Z`));
}
