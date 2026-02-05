import type { Metadata } from "next";
import "./globals.scss";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "One-page portfolio built with Next.js",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://kit.fontawesome.com/223a67c4a7.js" crossOrigin="anonymous"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}