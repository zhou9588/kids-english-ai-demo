import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import "./adventure.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "小芽英语 V2 · 儿童英语冒险",
  description: "听、说、选、写、收集五步儿童英语启蒙冒险。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "小芽英语 V2 · 儿童英语冒险",
    description: "听、说、选、写、收集，每次只完成一个小任务。",
    images: [{ url: "/og-v2.png", width: 1731, height: 909, alt: "小芽英语 V2 儿童英语冒险" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-v2.png"] },
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
