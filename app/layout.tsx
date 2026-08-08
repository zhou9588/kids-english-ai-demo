import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "小芽英语 · 儿童AI跟读启蒙",
  description: "儿童英语单词发音、跟读练习与趣味学习进度 Demo。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "小芽英语 · 每天勇敢开口说",
    description: "每天 3–5 个主题单词，听发音、练跟读、智能复习。",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "小芽英语儿童英语启蒙" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${nunito.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
