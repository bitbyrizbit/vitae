import type { Metadata } from "next";
import { Instrument_Serif, Figtree, Geist_Mono } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vitae",
  description:
    "Faculty self-appraisal platform with automated UGC API scoring, Google Scholar sync, and institutional reporting for CAS promotion and NAAC accreditation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${figtree.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen bg-base antialiased">{children}</body>
    </html>
  );
}
