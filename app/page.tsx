import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <header className="site-header" aria-label="Capcalera">
        <Link className="brand" href="/" aria-label="Apareix inici">
          <span className="brand-mark">A</span>
          <span>Apareix</span>
        </Link>
        <nav className="nav" aria-label="Navegacio principal">
          <a href="#servei">Servei</a>
          <a href="#preu">Preu</a>
          <Link href="/blog">Blog</Link>
          <Link href="/login">Entrar</Link>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <img
            className="hero-image"
            src="/assets/apareix-restaurant-hero.png"
            alt="Taula de restaurant amb telefon mostrant una interfície de mapa i reserva"
          />
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="eyebrow">Google Maps per restaurants</p>
            <h1 id="hero-title">Apareix tu primer quan et busquen.</h1>
            <p className="hero-copy">
              Una subscripció mensual perquè la fitxa del teu restaurant a Google Maps estigui
              activa, cuidada i orientada a generar trucades, indicacions i reserves.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#contacte">
                Activar per 50 EUR/mes
              </a>
              <Link className="button secondary" href="/login">
                Accedir al portal
              </Link>
            </div>
          </div>
        </section>

        <section className="proof-band" aria-label="Que inclou Apareix">
          <div>
            <strong>50 EUR</strong>
            <span>al mes</span>
          </div>
          <div>
            <strong>4 posts</strong>
            <span>cada mes</span>
          </div>
          <div>
            <strong>2 revisions</strong>
            <span>de ressenyes per setmana</span>
          </div>
          <div>
            <strong>1 informe</strong>
            <span>mensual en PDF</span>
          </div>
        </section>

        <section className="problem-band" aria-labelledby="problem-title">
          <p className="eyebrow">El problema</p>
          <h2 id="problem-title">El teu local pot ser excel·lent. Però si ningú el troba, no competeix.</h2>
          <p>
            Cada dia, clients que ja tenen intenció de menjar comparen restaurants a Google Maps.
            Si la teva fitxa sembla abandonada, respon poc o no explica per què reservar, el clic
            se&apos;n va a un competidor.
          </p>
        </section>

        <section id="servei" className="section services" aria-labelledby="services-title">
          <p className="eyebrow">Producte</p>
          <h2 id="services-title">Una operació mensual, no quatre posts solts.</h2>
          <div className="services-grid">
            {[
              ["01", "Onboarding guiat", "El restaurant dona dades, accés, carta, fotos, objectius i to de marca des del portal."],
              ["02", "Optimització de fitxa", "Categories, serveis, horaris, carta, reserves i descripció orientada a conversió."],
              ["03", "Posts setmanals", "Contingut sobre menú, plats, temporada, ressenyes, terrassa, reserves o grups."],
              ["04", "Ressenyes", "Seguiment de ressenyes i respostes suggerides amb to del restaurant."],
              ["05", "Informe mensual", "Accions fetes, evolució de ressenyes, clics, trucades, indicacions i properes millores."],
              ["06", "Portal client", "El client veu estat, tasques pendents, calendari i materials aprovables."]
            ].map(([num, title, copy]) => (
              <article key={title}>
                <span>{num}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="preu" className="section pricing-section">
          <div>
            <p className="eyebrow">Preu únic</p>
            <h2>Un sol pla. 50 EUR/mes per tenir Google Maps treballant cada setmana.</h2>
            <p>
              Sense paquets confusos ni pressupostos eterns. Apareix és una subscripció clara per
              mantenir la fitxa activa, respondre millor i entendre què està passant cada mes.
            </p>
          </div>
          <div className="pricing-grid single-plan">
            <aside className="price-card featured" aria-label="Pla Apareix">
              <p>Subscripció mensual</p>
              <h3>Apareix Maps</h3>
              <strong>50 EUR/mes</strong>
              <span>per restaurants que volen una fitxa viva sense dedicar-hi hores.</span>
              <ul>
                <li>Configuració inicial de la fitxa</li>
                <li>4 posts mensuals a Google Business Profile</li>
                <li>Revisió setmanal de ressenyes</li>
                <li>Respostes suggerides amb to del restaurant</li>
                <li>Informe mensual amb accions i evolució</li>
                <li>Portal client inclòs</li>
              </ul>
            </aside>
          </div>
        </section>

        <section id="contacte" className="section contact">
          <div>
            <p className="eyebrow">Començar</p>
            <h2>Activa Apareix per 50 EUR/mes.</h2>
            <p>
              Crea el teu compte, completa l&apos;onboarding i tindrem tot el necessari per posar la
              fitxa a treballar.
            </p>
          </div>
          <div className="contact-form">
            <Link className="button primary" href="/login">
              Crear compte i començar
            </Link>
            <a className="button secondary dark" href="mailto:hola@orioldelfau.com?subject=Alta%20Apareix%20Maps">
              Escriure per email
            </a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>Apareix</span>
        <p>Google Maps i Business Profile per restaurants.</p>
      </footer>
    </>
  );
}
