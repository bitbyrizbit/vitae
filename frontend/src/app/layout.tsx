import type { Metadata } from "next";
import { Fraunces, Outfit, Chivo_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const chivoMono = Chivo_Mono({
  subsets: ["latin"],
  variable: "--font-chivo-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vitae",
  description:
    "Faculty self-appraisal platform with automated UGC API scoring and Google Scholar sync.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${outfit.variable} ${chivoMono.variable}`}
    >
      <body className="min-h-screen bg-base antialiased text-text selection:bg-brown-light selection:text-blue">
        {children}
      </body>
    </html>
  );
}
