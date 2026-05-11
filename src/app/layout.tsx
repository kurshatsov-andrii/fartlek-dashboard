import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { FavoritesProvider } from "@/components/providers/favorites-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = "https://fartlek.events";
const siteTitle = "Fartlek Events 2026 — Спортивні події України";
const siteDescription =
  "Преміум-дашборд спортивних подій України. Марафони, трейли, велозаїзди, запливи та триатлони в 22+ містах. Живий календар, профілі організаторів та оновлення з Telegram-каналу.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s · Fartlek Events 2026",
  },
  description: siteDescription,
  applicationName: "Fartlek Events 2026",
  keywords: [
    "спортивні події Україна",
    "марафон Україна",
    "Київський марафон",
    "Львівський напівмарафон",
    "Карпатська ультра",
    "триатлон Україна",
    "трейл біг Україна",
    "велоспорт Україна",
    "Fartlek",
    "спортивний календар 2026",
  ],
  authors: [{ name: "Fartlek Events" }],
  creator: "Fartlek Events",
  openGraph: {
    type: "website",
    locale: "uk_UA",
    url: siteUrl,
    title: siteTitle,
    description: siteDescription,
    siteName: "Fartlek Events 2026",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Fartlek Events 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased min-h-screen`}
      >
        <ThemeProvider>
          <FavoritesProvider>{children}</FavoritesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
