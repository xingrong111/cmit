import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "山河有迹",
  description: "循迹读人，探索革命历史与文化足迹。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
