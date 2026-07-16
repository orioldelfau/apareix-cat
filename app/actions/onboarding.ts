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
    notes: value(formData, "notes"),
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
    email: user.email || restaurant.contact_email || ""
  });

  revalidatePath("/portal");
  redirect("/portal?onboarding=completed");
}

async function notifyOwner(input: { restaurantName: string; area: string; email: string }) {
  const resend = getResend();
  if (!resend) return;

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
      "",
      "Revisa el panell intern d'Apareix per preparar el calendari inicial."
    ].join("\n")
  });
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function values(formData: FormData, key: string) {
  return formData.getAll(key).map((item) => String(item));
}
