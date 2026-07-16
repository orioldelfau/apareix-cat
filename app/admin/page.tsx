import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { getCurrentProfile } from "@/lib/portal";

export const metadata = {
  title: "Admin | Apareix"
};

export default async function AdminPage() {
  const { supabase, profile } = await getCurrentProfile();

  if (profile?.role !== "admin") {
    return (
      <main className="portal-page">
        <section className="portal-card">
          <p className="eyebrow">Admin</p>
          <h1>Accés restringit</h1>
          <p>El teu usuari no té rol `admin`.</p>
          <Link className="button primary" href="/portal">
            Tornar al portal
          </Link>
        </section>
      </main>
    );
  }

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id,name,area,status,contact_email,created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="portal-page">
      <header className="portal-header">
        <Link className="brand dark-brand" href="/">
          <span className="brand-mark">A</span>
          <span>Apareix Admin</span>
        </Link>
        <form action={signOut}>
          <button className="ghost-button" type="submit">
            Sortir
          </button>
        </form>
      </header>

      <section className="portal-hero">
        <p className="eyebrow">Operacions</p>
        <h1>Restaurants i onboarding.</h1>
        <p>Primera consola interna per veure altes, estat i propers passos.</p>
      </section>

      <section className="portal-card">
        <h2>Clients</h2>
        <div className="table-list">
          {(restaurants || []).map((restaurant) => (
            <div key={restaurant.id}>
              <strong>{restaurant.name}</strong>
              <span>{restaurant.area}</span>
              <span>{restaurant.status}</span>
              <span>{restaurant.contact_email}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
