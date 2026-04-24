import type { Metadata } from "next";
import Script from "next/script";
import "./globals.scss";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "One-page portfolio built with Next.js",
  icons: {
    icon: [
      {
        url: "/img/favicon_dark.svg",
        type: "image/svg+xml",
      },
      {
        url: "/img/favicon_dark.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        url: "/img/favicon_light.svg",
        media: "(prefers-color-scheme: dark)",
        type: "image/svg+xml",
      },
      {
        url: "/img/favicon_light.png",
        media: "(prefers-color-scheme: dark)",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    shortcut: "/img/favicon_dark.png",
    apple: "/img/favicon_dark.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://kit.fontawesome.com/223a67c4a7.js"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}