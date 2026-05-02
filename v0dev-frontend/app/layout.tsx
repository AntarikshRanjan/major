import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "v0dev",
  description: "AI-powered website builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
