type FbHrefOptions = {
  sourcePage: string;
  leadId?: string;
  sourceDetail?: string;
};

export function fbHref(fbGroupUrl: string, { sourcePage, leadId, sourceDetail }: FbHrefOptions) {
  const url = new URL(fbGroupUrl);
  url.searchParams.set("source_page", sourcePage);
  url.searchParams.set("utm_source", "bank_club_site");
  url.searchParams.set("utm_medium", "fb_cta");
  url.searchParams.set("utm_campaign", sourcePage);
  if (leadId) url.searchParams.set("lead_id", leadId);
  if (sourceDetail) url.searchParams.set("source_detail", sourceDetail);
  return url.toString();
}
