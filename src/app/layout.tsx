import type { Metadata } from "next";

import { AppHeaderNav } from "@/components/app-header-nav";

import "./globals.css";

export const metadata: Metadata = {
  title: "Fastlane",
  description: "UGC marketing SaaS scaffold",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppHeaderNav />
        {children}
      </body>
    </html>
  );
}
