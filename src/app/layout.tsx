import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "One-page portfolio built with Next.js",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}