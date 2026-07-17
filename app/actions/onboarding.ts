"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getResend } from "@/lib/resend";
import { site } from "@/lib/site";

export async function submitOnboarding(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) redirect("/login");

  const restaurant = {
    owner_id: user.id,
    name: value(formData, "name"),
    google_maps_url: value(formData, "google_maps_url"),
    area: value(formData, "area"),
    cuisine_type: value(formData, "cuisine_type"),
    contact_email: value(formData, "contact_email") || user.email,
    contact_phone: value(formData, "contact_phone"),
    status: "onboarding_submitted"
  };

  const { data: savedRestaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .upsert(restaurant, { onConflict: "owner_id" })
    .select("id,name,area")
    .single();

  if (restaurantError) {
    redirect(`/onboarding?error=${encodeURIComponent(restaurantError.message)}`);
  }

  const response = {
    restaurant_id: savedRestaurant.id,
    goals: values(formData, "goals"),
    tone: value(formData, "tone"),
    signature_dishes: value(formData, "signature_dishes"),
    services: value(formData, "services"),
    competitors: value(formData, "competitors"),
    notes: buildOperationalBrief(formData),
    assets_url: value(formData, "assets_url")
  };

  const { error: responseError } = await supabase
    .from("onboarding_responses")
    .upsert(response, { onConflict: "restaurant_id" });

  if (responseError) {
    redirect(`/onboarding?error=${encodeURIComponent(responseError.message)}`);
  }

  await notifyOwner({
    restaurantName: savedRestaurant.name,
    area: savedRestaurant.area,
    email: user.email || restaurant.contact_email || "",
    phone: restaurant.contact_phone,
    googleMapsUrl: restaurant.google_maps_url,
    accessStatus: value(formData, "google_access_status"),
    firstMonthPriority: value(formData, "first_month_priority")
  });

  revalidatePath("/portal");
  redirect("/portal?onboarding=completed");
}

async function notifyOwner(input: {
  restaurantName: string;
  area: string;
  email: string;
  phone: string;
  googleMapsUrl: string;
  accessStatus: string;
  firstMonthPriority: string;
}) {
  const resend = getResend();
  if (!resend) return;

  try {
    await resend.emails.send({
      from: site.resendFrom,
      to: site.ownerEmail,
      subject: `Nou onboarding Apareix: ${input.restaurantName}`,
      text: [
        "Nou onboarding completat.",
        "",
        `Restaurant: ${input.restaurantName}`,
        `Zona: ${input.area}`,
        `Client: ${input.email}`,
        `Telefon: ${input.phone || "No indicat"}`,
        `Google Maps: ${input.googleMapsUrl}`,
        `Estat acces GBP: ${input.accessStatus || "pendent"}`,
        "",
        "Prioritat primer mes:",
        input.firstMonthPriority || "No indicada",
        "",
        "Seguent accio: revisar onboarding, validar acces a GBP i preparar calendari inicial."
      ].join("\n")
    });
  } catch (error) {
    console.error("Onboarding notification failed", error);
  }
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function values(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function buildOperationalBrief(formData: FormData) {
  const sections = [
    section("Links i conversio", [
      field("Web", value(formData, "website_url")),
      field("Reserves", value(formData, "reservation_url")),
      field("Carta/menu", value(formData, "menu_url")),
      field("Demanar ressenyes", value(formData, "review_request_url"))
    ]),
    section("Contingut", [
      field("Temes recomanats", value(formData, "preferred_post_topics")),
      field("Temes a evitar", value(formData, "forbidden_topics"))
    ]),
    section("Operacio mensual", [
      field("Horaris", value(formData, "business_hours")),
      field("Dates especials", value(formData, "special_dates")),
      field("Prioritat primer mes", value(formData, "first_month_priority"))
    ]),
    section("Accessos i aprovacio", [
      field("Email propietari GBP", value(formData, "google_access_owner_email")),
      field("Estat acces GBP", value(formData, "google_access_status")),
      field("Contacte aprovacio", value(formData, "approval_contact")),
      field("Canal aprovacio", value(formData, "approval_channel"))
    ]),
    section("Notes del client", [value(formData, "notes")])
  ].filter(Boolean);

  return sections.join("\n\n");
}

function section(title: string, rows: string[]) {
  const content = rows.filter(Boolean);
  if (content.length === 0) return "";
  return [`## ${title}`, ...content].join("\n");
}

function field(label: string, content: string) {
  return content ? `- ${label}: ${content}` : "";
}
