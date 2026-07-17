import Link from "next/link";
import { submitOnboarding } from "@/app/actions/onboarding";
import { requireUser } from "@/lib/portal";

export const metadata = {
  title: "Onboarding | Apareix"
};

export const dynamic = "force-dynamic";

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
          <h2>Links i conversio</h2>
          <p>
            Aquests links ens permeten convertir les visites de Maps en reserves, trucades i
            clients reals.
          </p>
          <div className="form-grid">
            <label>
              Web del restaurant
              <input name="website_url" type="url" placeholder="https://..." />
            </label>
            <label>
              Link de reserves
              <input name="reservation_url" type="url" placeholder="https://..." />
            </label>
            <label>
              Link de carta o menu
              <input name="menu_url" type="url" placeholder="https://..." />
            </label>
            <label>
              Link per demanar ressenyes
              <input name="review_request_url" type="url" placeholder="https://g.page/r/..." />
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
          <div className="form-grid">
            <label>
              To de marca
              <input name="tone" type="text" placeholder="proper, elegant, familiar, directe..." />
            </label>
            <label>
              Link a fotos o carpeta Drive
              <input name="assets_url" type="url" placeholder="https://drive.google.com/..." />
            </label>
          </div>
          <div className="form-grid">
            <label>
              Plats o productes destacats
              <textarea
                name="signature_dishes"
                rows={4}
                placeholder="Braves, menu migdia, arrossos, vins..."
              />
            </label>
            <label>
              Serveis importants
              <textarea
                name="services"
                rows={4}
                placeholder="Terrassa, grups, reserves, take away, menu..."
              />
            </label>
            <label>
              Temes que podem publicar
              <textarea
                name="preferred_post_topics"
                rows={4}
                placeholder="Menu de migdia, producte de temporada, equip, vins, terrassa..."
              />
            </label>
            <label>
              Temes o paraules a evitar
              <textarea
                name="forbidden_topics"
                rows={4}
                placeholder="Promocions que no voleu fer, plats que no voleu destacar, limitacions..."
              />
            </label>
          </div>
        </section>

        <section className="portal-card">
          <h2>Operacio mensual</h2>
          <div className="form-grid">
            <label>
              Horaris i dies de tancament
              <textarea
                name="business_hours"
                rows={4}
                placeholder="Horari habitual, cuina, dies tancats, festius..."
              />
            </label>
            <label>
              Dates especials o temporades
              <textarea
                name="special_dates"
                rows={4}
                placeholder="Vacances, festes locals, esdeveniments, temporada alta..."
              />
            </label>
            <label>
              Prioritat del primer mes
              <textarea
                name="first_month_priority"
                rows={4}
                placeholder="Ex: aconseguir mes reserves entre setmana, destacar menu, captar grups..."
              />
            </label>
            <label>
              Competidors de referencia
              <textarea
                name="competitors"
                rows={4}
                placeholder="Restaurants propers que vols vigilar o superar..."
              />
            </label>
          </div>
        </section>

        <section className="portal-card">
          <h2>Accessos i aprovacio</h2>
          <div className="form-grid">
            <label>
              Email propietari de Google Business Profile
              <input name="google_access_owner_email" type="email" placeholder="email@gmail.com" />
            </label>
            <label>
              Estat de l'acces a Google Business Profile
              <select name="google_access_status" defaultValue="pendent">
                <option value="pendent">Encara pendent</option>
                <option value="sollicitud_enviada">Sol.licitud enviada</option>
                <option value="gestor_acceptat">Apareix ja te acces</option>
                <option value="no_ho_se">No ho se</option>
              </select>
            </label>
            <label>
              Persona que aprova temes delicats
              <input name="approval_contact" type="text" placeholder="Nom i telefon/email" />
            </label>
            <label>
              Canal preferit d'aprovacio
              <select name="approval_channel" defaultValue="whatsapp">
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="portal">Portal</option>
                <option value="sense_revisio">Sense revisio previa en posts normals</option>
              </select>
            </label>
          </div>
          <label>
            Notes finals
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
