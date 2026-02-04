import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "에프텀 AFTERM | 개인 웰다잉 관리 플랫폼",
  description: "갑자기 떠나도 괜찮습니다, 1분이면 됩니다. 삶의 이후를 위한 개인 맞춤 웰다잉 관리 솔루션.",
  keywords: ["웰다잉", "디지털유산", "유언", "엔딩노트", "사전장례", "에프텀 AFTERM"],
  authors: [{ name: "에프텀 AFTERM" }],
  creator: "에프텀 AFTERM",
  publisher: "에프텀 AFTERM",
  metadataBase: new URL('https://afterm.co.kr'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "에프텀 AFTERM | 개인 웰다잉 관리 플랫폼",
    description: "갑자기 떠나도 괜찮습니다, 1분이면 됩니다. 삶의 이후를 위한 개인 맞춤 웰다잉 관리 솔루션.",
    url: 'https://afterm.co.kr',
    siteName: '에프텀 AFTERM',
    locale: 'ko_KR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
  verification: {
    other: {
      'naver-site-verification': '4984ce60706352e372bae9036e5e672c8ba0482b',
      'google-site-verification': 'TtkbuVcLlB_DHhSjRq7wTNAB1CtakIM0uekUaYNzEP0',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
