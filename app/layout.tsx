import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import EngagementTracker from "./components/EngagementTracker";
import TopNav from "./components/TopNav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tejeswaar Reddy — Game Systems Programmer · Technical Artist",
  description:
    "I build the systems that make worlds feel real — from low-level C++ engines to modular combat in Unreal Engine 5. Portfolio of Tejeswaar Reddy.",
  keywords: [
    "game programmer",
    "game developer",
    "Unreal Engine",
    "C++",
    "technical artist",
    "game engine",
    "portfolio",
    "Tejeswaar Reddy",
  ],
  authors: [{ name: "Tejeswaar Reddy" }],
  openGraph: {
    title: "Tejeswaar Reddy — Game Systems Programmer",
    description:
      "I build the systems that make worlds feel real — from low-level C++ engines to modular combat in Unreal Engine 5.",
    type: "website",
    locale: "en_US",
    url: "https://tejeswaarreddy.dev",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tejeswaar Reddy — Game Systems Programmer",
    description:
      "I build the systems that make worlds feel real — from low-level C++ engines to modular combat in Unreal Engine 5.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-ctp-base text-ctp-text`}
      >
        <TopNav />

        <main>{children}</main>

        {/* Engagement tracker (popups + time tracking) */}
        <EngagementTracker />
      </body>
    </html>
  );
}
