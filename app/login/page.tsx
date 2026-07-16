import Link from "next/link";
import { signIn, signUp } from "@/app/actions/auth";
import { hasSupabaseEnv } from "@/lib/env";

export const metadata = {
  title: "Entrar | Apareix"
};

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const configured = hasSupabaseEnv();

  return (
    <main className="auth-page">
      <Link className="brand dark-brand" href="/">
        <span className="brand-mark">A</span>
        <span>Apareix</span>
      </Link>

      <section className="auth-shell">
        <div>
          <p className="eyebrow">Portal client</p>
          <h1>Gestiona Google Maps sense perseguir correus.</h1>
          <p>
            Crea el compte del restaurant, completa l&apos;onboarding i tindrem tota la informació
            ordenada per començar.
          </p>
        </div>

        <div className="auth-grid">
          {!configured ? (
            <div className="setup-warning">
              <h2>Falta connectar Supabase</h2>
              <p>
                L&apos;app ja està preparada, però cal afegir les variables
                `NEXT_PUBLIC_SUPABASE_URL` i `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
              </p>
            </div>
          ) : null}

          {params?.error ? <p className="form-error">{decodeURIComponent(params.error)}</p> : null}

          <form className="portal-card" action={signUp}>
            <h2>Crear compte</h2>
            <label>
              Nom
              <input name="full_name" type="text" placeholder="Oriol del restaurant" required />
            </label>
            <label>
              Email
              <input name="email" type="email" placeholder="nom@restaurant.cat" required />
            </label>
            <label>
              Contrasenya
              <input name="password" type="password" minLength={8} required />
            </label>
            <button className="button primary" type="submit" disabled={!configured}>
              Crear compte i fer onboarding
            </button>
          </form>

          <form className="portal-card muted-card" action={signIn}>
            <h2>Ja tinc compte</h2>
            <label>
              Email
              <input name="email" type="email" placeholder="nom@restaurant.cat" required />
            </label>
            <label>
              Contrasenya
              <input name="password" type="password" required />
            </label>
            <button className="button secondary dark" type="submit" disabled={!configured}>
              Entrar al portal
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
