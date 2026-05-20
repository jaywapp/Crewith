import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crewith Admin",
  description: "Sports club operations dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
