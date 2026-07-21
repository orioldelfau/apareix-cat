import { NextResponse } from "next/server";
import { getResend } from "@/lib/resend";
import { site } from "@/lib/site";

const allowedOrigins = new Set([
  "https://apareix.cat",
  "https://www.apareix.cat",
  "https://apareix-cat.vercel.app",
  "http://localhost:3000"
]);

type ContactPayload = {
  restaurant?: string;
  name?: string;
  email?: string;
  phone?: string;
  area?: string;
  mapsUrl?: string;
  message?: string;
  consent?: boolean;
  source?: string;
};

type NormalizedLead = ReturnType<typeof normalizePayload>;

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin"))
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  if (origin && !allowedOrigins.has(origin)) {
    return NextResponse.json({ ok: false, error: "Origin not allowed" }, { status: 403, headers });
  }

  let payload: ContactPayload;

  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400, headers });
  }

  const lead = normalizePayload(payload);
  const missing = validateLead(lead);

  if (missing) {
    return NextResponse.json({ ok: false, error: missing }, { status: 400, headers });
  }

  const resend = getResend();

  if (!resend) {
    return NextResponse.json({ ok: false, error: "Email service not configured" }, { status: 500, headers });
  }

  const demo = await generateDemo(lead);

  await resend.emails.send({
    from: site.resendFrom,
    to: lead.email,
    replyTo: site.ownerEmail,
    subject: `La teva demo Apareix: ${lead.restaurant}`,
    html: renderDemoEmail(lead, demo),
    text: renderDemoText(lead, demo)
  });

  await resend.emails.send({
    from: site.resendFrom,
    to: site.ownerEmail,
    replyTo: lead.email,
    subject: `Demo automàtica enviada: ${lead.restaurant}`,
    text: [
      "Nou lead rebut des de la web d'Apareix i demo automàtica enviada.",
      "",
      `Restaurant: ${lead.restaurant}`,
      `Persona: ${lead.name}`,
      `Email: ${lead.email}`,
      `Telefon: ${lead.phone}`,
      `Poblacio/zona: ${lead.area || "No indicat"}`,
      `Google Maps: ${lead.mapsUrl || "No indicat"}`,
      `Origen: ${lead.source || "Web"}`,
      "",
      "Missatge:",
      lead.message || "Sense missatge",
      "",
      "Demo enviada:",
      demo.summary,
      "",
      "Pla suggerit: Apareix 50 EUR/mes",
      "Consentiment: acceptat"
    ].join("\n")
  });

  return NextResponse.json({ ok: true, demoSent: true }, { headers });
}

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };

  if (origin && allowedOrigins.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  }

  return headers;
}

function normalizePayload(payload: ContactPayload) {
  return {
    restaurant: clean(payload.restaurant),
    name: clean(payload.name),
    email: clean(payload.email).toLowerCase(),
    phone: clean(payload.phone),
    area: clean(payload.area),
    mapsUrl: clean(payload.mapsUrl, 500),
    message: clean(payload.message, 1200),
    consent: payload.consent === true,
    source: clean(payload.source)
  };
}

function validateLead(lead: ReturnType<typeof normalizePayload>) {
  if (!lead.restaurant) return "Restaurant is required";
  if (!lead.name) return "Name is required";
  if (!isEmail(lead.email)) return "Valid email is required";
  if (!lead.phone) return "Phone is required";
  if (!isUrl(lead.mapsUrl)) return "Google Maps URL is required";
  if (!lead.consent) return "Consent is required";
  return null;
}

function clean(value: unknown, maxLength = 160) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isUrl(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

async function generateDemo(lead: NormalizedLead) {
  const fallback = buildDeterministicDemo(lead);

  if (!process.env.OPENAI_API_KEY) return fallback;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        temperature: 0.45,
        max_output_tokens: 1200,
        input: [
          {
            role: "system",
            content:
              "Ets Apareix, un servei de gestio mensual de Google Maps per restaurants. Genera una demo comercial honesta, accionable i concreta en catala. No inventis metriques reals ni afirmis haver consultat Google Maps en directe. Treballa nomes amb les dades aportades pel lead."
          },
          {
            role: "user",
            content: JSON.stringify({
              restaurant: lead.restaurant,
              area: lead.area,
              googleMapsUrl: lead.mapsUrl,
              desiredImprovement: lead.message
            })
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "apareix_demo",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: { type: "string" },
                opportunities: {
                  type: "array",
                  minItems: 3,
                  maxItems: 3,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      title: { type: "string" },
                      explanation: { type: "string" }
                    },
                    required: ["title", "explanation"]
                  }
                },
                sevenDayPlan: {
                  type: "array",
                  minItems: 4,
                  maxItems: 4,
                  items: { type: "string" }
                },
                monthlyRoutine: {
                  type: "array",
                  minItems: 4,
                  maxItems: 4,
                  items: { type: "string" }
                },
                cta: { type: "string" }
              },
              required: ["summary", "opportunities", "sevenDayPlan", "monthlyRoutine", "cta"]
            }
          }
        }
      })
    });

    if (!response.ok) return fallback;

    const data = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string }> }>;
    };
    const text = data.output_text || data.output?.flatMap((item) => item.content || []).find((item) => item.text)?.text;
    if (!text) return fallback;

    return JSON.parse(text) as DemoReport;
  } catch {
    return fallback;
  }
}

type DemoReport = {
  summary: string;
  opportunities: Array<{ title: string; explanation: string }>;
  sevenDayPlan: string[];
  monthlyRoutine: string[];
  cta: string;
};

function buildDeterministicDemo(lead: NormalizedLead): DemoReport {
  const area = lead.area || "la teva zona";
  const message = lead.message.toLowerCase();
  const wantsReviews = message.includes("resseny") || message.includes("reseñ");
  const wantsPhotos = message.includes("foto") || message.includes("imatge") || message.includes("imagen");
  const wantsPosts = message.includes("post") || message.includes("public");

  const opportunities = [
    {
      title: "Fer que la primera impressió vengui millor",
      explanation: `La fitxa de ${lead.restaurant} ha d'explicar en pocs segons per què val la pena escollir-vos a ${area}: tipus de cuina, ambient, plats clau i accions ràpides com reservar, trucar o veure la carta.`
    },
    {
      title: wantsPosts ? "Convertir les publicacions en rutina" : "Afegir activitat recent a la fitxa",
      explanation:
        "Una fitxa amb activitat recent transmet que el restaurant està viu. El primer objectiu seria publicar contingut útil cada setmana: plat destacat, menú, temporada, grups, terrassa o ressenya destacada."
    },
    {
      title: wantsReviews ? "Treballar les ressenyes com a prova social" : "Reforçar confiança abans de la reserva",
      explanation:
        "Les ressenyes i les respostes són una part visible de la decisió. El sistema hauria de detectar patrons, preparar respostes coherents i convertir bones opinions en contingut comercial."
    }
  ];

  if (wantsPhotos) {
    opportunities[0] = {
      title: "Ordenar fotos perquè venguin l'experiència real",
      explanation:
        "Les fotos solen decidir el clic abans que el client llegeixi res. Prioritzaria plats reconeixibles, sala, façana, carta i imatges recents que representin bé el restaurant."
    };
  }

  return {
    summary: `Demo automàtica per ${lead.restaurant}: primera lectura orientada a millorar Google Maps, SEO local i conversió en reserves, trucades o indicacions.`,
    opportunities,
    sevenDayPlan: [
      "Revisar nom, categories, horaris, web, carta, reserves i telèfon.",
      "Preparar una descripció curta enfocada a cerques locals i decisió ràpida.",
      "Crear el primer post setmanal amb una proposta concreta del restaurant.",
      "Detectar ressenyes prioritàries i preparar respostes amb to de marca."
    ],
    monthlyRoutine: [
      "4 publicacions mensuals a Google Business Profile.",
      "Seguiment de ressenyes i respostes suggerides.",
      "Revisió de dades clau: trucades, indicacions, clics i visibilitat.",
      "Informe mensual amb accions fetes i properes prioritats."
    ],
    cta: "Si vols, podem convertir aquesta demo en una rutina mensual per 50 EUR/mes."
  };
}

function renderDemoEmail(lead: NormalizedLead, demo: DemoReport) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#f7f0e4;padding:28px;color:#102019">
      <div style="max-width:680px;margin:0 auto;background:#fffaf1;border:1px solid #e7dfd0;border-radius:22px;overflow:hidden">
        <div style="background:#064733;color:white;padding:28px">
          <p style="margin:0 0 10px;text-transform:uppercase;letter-spacing:.14em;font-size:12px;color:#d7e8dc">Demo gratuïta Apareix</p>
          <h1 style="margin:0;font-family:Georgia,serif;font-size:34px;line-height:1.05">Primera lectura per ${escapeHtml(lead.restaurant)}</h1>
          <p style="margin:14px 0 0;color:#d7e8dc;line-height:1.55">${escapeHtml(demo.summary)}</p>
        </div>
        <div style="padding:28px">
          <p style="margin-top:0;color:#536259;line-height:1.6">Aquesta demo és automàtica i està basada en la informació que ens has enviat. Per fer una auditoria amb dades reals de rendiment caldria accés a Google Business Profile.</p>
          <h2 style="font-family:Georgia,serif;color:#064733">3 oportunitats prioritàries</h2>
          ${demo.opportunities
            .map(
              (item) => `
                <div style="border:1px solid #e7dfd0;border-radius:16px;padding:16px;margin:12px 0;background:white">
                  <strong style="color:#064733">${escapeHtml(item.title)}</strong>
                  <p style="margin:8px 0 0;color:#536259;line-height:1.55">${escapeHtml(item.explanation)}</p>
                </div>
              `
            )
            .join("")}
          <h2 style="font-family:Georgia,serif;color:#064733">Pla dels primers 7 dies</h2>
          ${renderList(demo.sevenDayPlan)}
          <h2 style="font-family:Georgia,serif;color:#064733">Com seria la rutina mensual</h2>
          ${renderList(demo.monthlyRoutine)}
          <div style="margin-top:26px;padding:20px;border-radius:18px;background:#064733;color:white">
            <strong>${escapeHtml(demo.cta)}</strong>
            <p style="margin:10px 0 0;color:#d7e8dc">Respon aquest correu i ho activem sense reunions llargues.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderDemoText(lead: NormalizedLead, demo: DemoReport) {
  return [
    `Demo gratuïta Apareix - ${lead.restaurant}`,
    "",
    demo.summary,
    "",
    "Aquesta demo és automàtica i està basada en la informació que ens has enviat. Per una auditoria amb dades reals caldria accés a Google Business Profile.",
    "",
    "3 oportunitats prioritàries:",
    ...demo.opportunities.map((item, index) => `${index + 1}. ${item.title}: ${item.explanation}`),
    "",
    "Pla dels primers 7 dies:",
    ...demo.sevenDayPlan.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Rutina mensual:",
    ...demo.monthlyRoutine.map((item, index) => `${index + 1}. ${item}`),
    "",
    demo.cta
  ].join("\n");
}

function renderList(items: string[]) {
  return `<ul style="padding-left:20px;color:#536259;line-height:1.7">${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
