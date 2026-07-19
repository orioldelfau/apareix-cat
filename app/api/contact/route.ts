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

  await resend.emails.send({
    from: site.resendFrom,
    to: site.ownerEmail,
    replyTo: lead.email,
    subject: `Nou lead Apareix: ${lead.restaurant}`,
    text: [
      "Nou lead rebut des de la web d'Apareix.",
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
      "Pla sol.licitat: Apareix 50 EUR/mes",
      "Consentiment: acceptat"
    ].join("\n")
  });

  return NextResponse.json({ ok: true }, { headers });
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
