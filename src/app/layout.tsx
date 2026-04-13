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
  title: "에프텀 AFTERM | 디지털 유산 관리 플랫폼",
  description: "갑자기 떠나도 괜찮아요. 나의 디지털 유산 찾고 안전하게 보관해보세요.",
  keywords: ["디지털유산", "디지털유산관리", "유산관리플랫폼", "웰다잉", "유언", "엔딩노트", "사전장례", "에프텀 AFTERM"],
  authors: [{ name: "에프텀 AFTERM" }],
  creator: "에프텀 AFTERM",
  publisher: "에프텀 AFTERM",
  metadataBase: new URL('https://afterm.co.kr'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "에프텀 AFTERM | 디지털 유산 관리 플랫폼",
    description: "갑자기 떠나도 괜찮아요. 나의 디지털 유산 찾고 안전하게 보관해보세요.",
    url: 'https://afterm.co.kr',
    siteName: '에프텀 AFTERM',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "에프텀 AFTERM | 디지털 유산 관리 플랫폼",
    description: "갑자기 떠나도 괜찮아요. 나의 디지털 유산 찾고 안전하게 보관해보세요.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
  verification: {
    google: "TtkbuVcLlB_DHhSjRq7wTNAB1CtakIM0uekUaYNzEP0",
    other: {
      "naver-site-verification": "4984ce60706352e372bae9036e5e672c8ba0482b",
    },
  },
};
// Updated Verification Config: Force Deploy

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
        {/* Deploy Check: Google Verified */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

// Trigger deployment Mon Feb  9 14:32:48 KST 2026

// Forced deployment at Mon Feb  9 14:50:54 KST 2026: Emergency Fix Attempt

// UI Update: Host/Guest Terminology Mon Feb  9 14:56:37 KST 2026

// Final Deployment: V2 Emergency Fix Mon Feb  9 15:03:19 KST 2026

// Fix: Comment Authors Sync Mon Feb  9 15:07:55 KST 2026

// Feature: Comment Deletion & Profile Fix Mon Feb  9 15:17:18 KST 2026

// Final V3: Notifications & Reply Fix Mon Feb  9 15:24:06 KST 2026

// Forced Redeploy: Sync Features Mon Feb  9 15:31:43 KST 2026

// Emergency Fix: Manual Profile Fetch Mon Feb  9 15:40:04 KST 2026

// Final God Mode: Server Profile Fetch Mon Feb  9 15:45:02 KST 2026

// Final UI Repair: Fallbacks Mon Feb  9 15:56:33 KST 2026

// Final Deployment: Sync Mon Feb  9 16:10:23 KST 2026

// Final Verification: All Checks Passed Mon Feb  9 16:25:48 KST 2026
