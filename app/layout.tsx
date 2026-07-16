import type { Metadata } from "next";
import "../styles.css";

export const metadata: Metadata = {
  title: "Apareix | Google Maps per restaurants",
  description:
    "Apareix manté activa la fitxa de Google Maps de restaurants amb posts, ressenyes i informes mensuals per 50 EUR/mes."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ca">
      <body>{children}</body>
    </html>
  );
}
