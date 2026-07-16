import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { requireUser } from "@/lib/portal";

export const metadata = {
  title: "Portal | Apareix"
};

export const dynamic = "force-dynamic";

export default async function PortalPage({
  searchParams
}: {
  searchParams?: Promise<{ onboarding?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id,name,area,status,google_maps_url,created_at")
    .eq("owner_id", user.id)
    .maybeSingle();

  const { data: posts } = restaurant
    ? await supabase
        .from("content_posts")
        .select("id,title,status,scheduled_for")
        .eq("restaurant_id", restaurant.id)
        .order("scheduled_for", { ascending: true })
        .limit(6)
    : { data: [] };

  return (
    <main className="portal-page">
      <header className="portal-header">
        <Link className="brand dark-brand" href="/">
          <span className="brand-mark">A</span>
          <span>Apareix</span>
        </Link>
        <nav className="portal-nav">
          <Link href="/onboarding">Onboarding</Link>
          <form action={signOut}>
            <button className="ghost-button" type="submit">
              Sortir
            </button>
          </form>
        </nav>
      </header>

      {params?.onboarding === "completed" ? (
        <p className="success-banner">Onboarding rebut. Ara prepararem la configuració inicial.</p>
      ) : null}

      <section className="portal-hero">
        <p className="eyebrow">Portal client</p>
        <h1>{restaurant ? restaurant.name : "Completa l'onboarding per començar."}</h1>
        <p>
          Estat, tasques i contingut de Google Maps en un sol lloc. La primera versió ja concentra
          l&apos;alta i la rutina mensual.
        </p>
      </section>

      <section className="portal-grid">
        <article className="portal-card">
          <h2>Estat</h2>
          {restaurant ? (
            <>
              <p className="status-pill">{restaurant.status}</p>
              <p>{restaurant.area}</p>
              <a href={restaurant.google_maps_url} target="_blank" rel="noreferrer">
                Obrir fitxa de Google Maps
              </a>
            </>
          ) : (
            <>
              <p>Encara no tenim les dades del restaurant.</p>
              <Link className="button primary" href="/onboarding">
                Fer onboarding
              </Link>
            </>
          )}
        </article>

        <article className="portal-card">
          <h2>Properes tasques</h2>
          <ul className="task-list">
            <li className={restaurant ? "done" : ""}>Completar onboarding</li>
            <li>Validar accés a Google Business Profile</li>
            <li>Preparar calendari inicial de posts</li>
            <li>Activar informe mensual</li>
          </ul>
        </article>

        <article className="portal-card wide-card">
          <h2>Calendari de posts</h2>
          {posts && posts.length > 0 ? (
            <div className="table-list">
              {posts.map((post) => (
                <div key={post.id}>
                  <strong>{post.title}</strong>
                  <span>{post.status}</span>
                  <span>{post.scheduled_for || "Sense data"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>Encara no hi ha posts preparats. Apareixeran aquí quan l&apos;equip els generi.</p>
          )}
        </article>
      </section>
    </main>
  );
}
