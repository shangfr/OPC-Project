import type { Metadata } from "next";
import "./globals.css";
import { JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { validateEnv } from "@/lib/env";

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

// 生产环境验证环境变量
if (process.env.NODE_ENV === 'production') {
  validateEnv();
}

export const metadata: Metadata = {
  title: {
    default: "省心咨询 - AI智能咨询平台",
    template: "%s | 省心咨询"
  },
  description: "专业AI法律咨询、商业战略、财税规划等21位专家在线服务",
  keywords: ["AI咨询", "法律咨询", "商业战略", "财税规划", "智能顾问"],
  authors: [{ name: "北京省心咨询" }],
  creator: "北京省心咨询",
  publisher: "北京省心咨询",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://follow-ai.com",
    title: "省心咨询 - AI智能咨询平台",
    description: "专业AI法律咨询、商业战略、财税规划等21位专家在线服务",
    siteName: "省心咨询"
  },
  twitter: {
    card: "summary_large_image",
    title: "省心咨询 - AI智能咨询平台",
    description: "专业AI法律咨询、商业战略、财税规划等21位专家在线服务"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={cn("font-mono", jetbrainsMono.variable)}>
      <body className="antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
