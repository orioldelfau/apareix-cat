import Link from "next/link";
import { submitOnboarding } from "@/app/actions/onboarding";
import { requireUser } from "@/lib/portal";

export const metadata = {
  title: "Onboarding | Apareix"
};

export default async function OnboardingPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { user } = await requireUser();

  return (
    <main className="portal-page">
      <PortalHeader />

      <section className="portal-hero">
        <p className="eyebrow">Onboarding</p>
        <h1>Explica&apos;ns el restaurant una vegada. Nosaltres ho convertim en rutina.</h1>
        <p>
          Aquesta informació alimenta la fitxa, els posts mensuals, les respostes a ressenyes i el
          primer informe.
        </p>
      </section>

      {params?.error ? <p className="form-error">{decodeURIComponent(params.error)}</p> : null}

      <form className="onboarding-form" action={submitOnboarding}>
        <section className="portal-card">
          <h2>Restaurant</h2>
          <div className="form-grid">
            <label>
              Nom del restaurant
              <input name="name" type="text" placeholder="Restaurant Exemple" required />
            </label>
            <label>
              Zona o barri
              <input name="area" type="text" placeholder="Gràcia, Girona, Eixample..." required />
            </label>
            <label>
              Tipus de cuina
              <input name="cuisine_type" type="text" placeholder="Mediterrània, brasa, sushi..." />
            </label>
            <label>
              Link de Google Maps
              <input name="google_maps_url" type="url" placeholder="https://maps.google.com/..." required />
            </label>
            <label>
              Email de contacte
              <input name="contact_email" type="email" defaultValue={user.email || ""} />
            </label>
            <label>
              WhatsApp o telèfon
              <input name="contact_phone" type="text" placeholder="+34..." />
            </label>
          </div>
        </section>

        <section className="portal-card">
          <h2>Objectius</h2>
          <div className="checkbox-grid">
            {[
              "Més trucades",
              "Més reserves",
              "Més indicacions",
              "Més ressenyes",
              "Millor imatge",
              "Més clients del barri"
            ].map((goal) => (
              <label className="checkbox-card" key={goal}>
                <input name="goals" type="checkbox" value={goal} />
                {goal}
              </label>
            ))}
          </div>
        </section>

        <section className="portal-card">
          <h2>Marca i contingut</h2>
          <label>
            To de marca
            <input name="tone" type="text" placeholder="proper, elegant, familiar, directe..." />
          </label>
          <label>
            Plats o productes destacats
            <textarea name="signature_dishes" rows={4} placeholder="Braves, menú migdia, arrossos, vins..." />
          </label>
          <label>
            Serveis importants
            <textarea name="services" rows={3} placeholder="Terrassa, grups, reserves, take away, menú..." />
          </label>
          <label>
            Competidors de referència
            <textarea name="competitors" rows={3} placeholder="Restaurants propers que vols vigilar o superar..." />
          </label>
          <label>
            Link a fotos, carta o carpeta Drive
            <input name="assets_url" type="url" placeholder="https://drive.google.com/..." />
          </label>
          <label>
            Notes
            <textarea name="notes" rows={4} placeholder="Qualsevol cosa que hauríem de saber abans de començar." />
          </label>
        </section>

        <button className="button primary" type="submit">
          Enviar onboarding
        </button>
      </form>
    </main>
  );
}

function PortalHeader() {
  return (
    <header className="portal-header">
      <Link className="brand dark-brand" href="/">
        <span className="brand-mark">A</span>
        <span>Apareix</span>
      </Link>
      <nav className="portal-nav">
        <Link href="/portal">Portal</Link>
        <Link href="/admin">Admin</Link>
      </nav>
    </header>
  );
}
