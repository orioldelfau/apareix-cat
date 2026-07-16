/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@supabase/supabase-js", "@supabase/ssr", "resend"]
};

export default nextConfig;
