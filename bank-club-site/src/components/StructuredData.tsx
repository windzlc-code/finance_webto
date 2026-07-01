import { absoluteUrl, breadcrumbItems } from "@/lib/seo";

type BreadcrumbProps = {
  current: string;
  path: string;
};

type JsonLdProps = {
  data: Record<string, unknown>;
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}

export function BreadcrumbJsonLd({ current, path }: BreadcrumbProps) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems(current, path).map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "銀行俱樂部",
        url: absoluteUrl("/"),
        logo: absoluteUrl("/brand/bank_club_logo.png"),
      }}
    />
  );
}
