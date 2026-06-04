import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KCGI Research Hub",
  description: "KCGI 리서치 대시보드를 Next.js로 통합한 로컬 허브"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
