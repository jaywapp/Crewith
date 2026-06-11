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
      <body>
        {children}
        <footer style={{ padding: 16, textAlign: "center", fontSize: 13 }}>
          <a href="/legal/terms">이용약관</a>
          {" · "}
          <a href="/legal/privacy">개인정보처리방침</a>
        </footer>
      </body>
    </html>
  );
}
