import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FERADIOZ — Your circle, your space",
  description: "A private social space made for your friends.",
  manifest: "/manifest.json",
  themeColor: "#f7f8fc",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<footer className="site-credit">Made with <span aria-label="love">♥</span> by <strong>YAFI</strong></footer></body></html>;
}
