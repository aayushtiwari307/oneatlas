import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AppProviders } from "@/components/providers";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CompareTray } from "@/components/compare/compare-tray";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "OneAtlas — AI model discovery",
    template: "%s · OneAtlas",
  },
  description:
    "Discover and compare AI models across labs and inference providers. Explore capabilities, context windows and pricing.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <NuqsAdapter>
          <AppProviders>
            <div className="app-frame">
              <SiteHeader />
              <main className="min-h-[calc(100vh-220px)]">{children}</main>
              <CompareTray />
              <SiteFooter />
            </div>
          </AppProviders>
        </NuqsAdapter>
      </body>
    </html>
  );
}
