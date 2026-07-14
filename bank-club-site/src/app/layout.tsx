import type { Metadata } from "next";
import Script from "next/script";
import { createPageMetadata } from "@/lib/seo";
import { allowPublicIndexing } from "@/lib/site-data";
import { readDB } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  ...createPageMetadata({
    title: "銀行行員俱樂部｜銀行專員一對一 信用貸/房屋貸/企業貸免費評估",
    description:
      "銀行行員俱樂部連接銀行專業服務人員，提供信用貸款、房屋貸款、企業貸款諮詢，整理申請資格、文件清單、網路申辦流程與 LINE 一對一免費評估。",
    path: "/",
  }),
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "銀行行員俱樂部｜銀行專員一對一 信用貸/房屋貸/企業貸免費評估",
    template: "%s",
  },
  robots: allowPublicIndexing
    ? undefined
    : {
        index: false,
        follow: false,
        nocache: true,
        googleBot: { index: false, follow: false, noimageindex: true, "max-snippet": -1 },
      },
};

function isValidGaMeasurementId(value: string) {
  return /^G-[A-Z0-9]+$/i.test(value.trim());
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const db = await readDB();
  const gaMeasurementId = db.settings.gaMeasurementId.trim();
  const searchConsoleVerification = db.settings.googleSearchConsoleVerification.trim();
  const hasGa = isValidGaMeasurementId(gaMeasurementId);

  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <head>
        <link rel="prefetch" href="/tfse/" as="document" />
        <link rel="prefetch" href="/valuation/?from=bank-club" as="document" />
        <link rel="prefetch" href="/valuation/_lvr_vendor.bundle.js?v=20260328-1" as="script" />
        <link rel="prefetch" href="/valuation/lvr-bridge.js?v=20260510-file-fetch" as="script" />
        <link rel="prefetch" href="/valuation/_lvr_common.bundle.js" as="script" />
        <link rel="prefetch" href="/valuation/valuation-app.bundle.js?v=20260714-performance-bundle" as="script" />
        {allowPublicIndexing && searchConsoleVerification ? (
          <meta name="google-site-verification" content={searchConsoleVerification} />
        ) : null}
      </head>
      <body className="min-h-full flex flex-col">
        {hasGa ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}', { send_page_view: false });
              `}
            </Script>
          </>
        ) : null}
        {children}
      </body>
    </html>
  );
}
