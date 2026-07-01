type LineHrefOptions = {
  sourcePage: string;
  leadId?: string;
  sourceDetail?: string;
};

export function lineHref(lineUrl: string, { sourcePage, leadId, sourceDetail }: LineHrefOptions) {
  const [base, hash] = lineUrl.split("#");
  const isAbsolute = /^https?:\/\//i.test(base);
  const url = new URL(base || "/", isAbsolute ? undefined : "http://bank-club.local");
  url.searchParams.set("source_page", sourcePage);
  url.searchParams.set("utm_source", "bank_club_site");
  url.searchParams.set("utm_medium", "line_cta");
  url.searchParams.set("utm_campaign", sourcePage);
  if (leadId) url.searchParams.set("lead_id", leadId);
  if (sourceDetail) url.searchParams.set("source_detail", sourceDetail);
  if (hash) url.hash = hash;
  return isAbsolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
}
