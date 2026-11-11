import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FERADIOZ — Your circle, your space",
  description: "A private social space made for your friends.",
  manifest: "/manifest.json",
  themeColor: "#09090f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
