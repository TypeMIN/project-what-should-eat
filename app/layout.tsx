import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "오늘 뭐 먹지?",
  description: "함께 고르는 오늘의 한 끼",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
