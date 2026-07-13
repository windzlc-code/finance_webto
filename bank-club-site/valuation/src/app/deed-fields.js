import { safeNumber, toNumber } from "../utils.js";

function round3(value) {
  return +Number(value || 0).toFixed(3);
}

export function calculateAreaInfo(values = {}) {
  const main = safeNumber(values.main);
  const attach = safeNumber(values.attach);
  const common = safeNumber(values.common);
  const other = safeNumber(values.other);
  const landShare = safeNumber(values.landShare);
  const parking = safeNumber(values.parking);
  const house = main + attach + common;
  const total = house + parking;

  return {
    main,
    attach,
    common,
    other,
    landShare,
    parking: round3(parking),
    house: round3(house),
    total: round3(total),
    usable: round3(house),
    source: "sum"
  };
}

export function parkingPricingInfo(parkingAreaPing) {
  const area = Math.max(0, Number(parkingAreaPing) || 0);
  if (area <= 0) return { count: 0, fullCount: 0, hasDiscountPart: false, priceMultiplier: 0 };
  if (area < 8) return { count: 1, fullCount: 0, hasDiscountPart: true, priceMultiplier: 0.7 };
  if (area < 15) return { count: 1, fullCount: 1, hasDiscountPart: false, priceMultiplier: 1 };
  const count = Math.ceil(area / 8);
  return { count, fullCount: count, hasDiscountPart: false, priceMultiplier: count };
}

export function shouldUseOcrParkingCount(count) {
  return Number(count) > 0;
}

export function normalizeComparableParkingCount(value) {
  const normalized = String(value ?? "").normalize("NFKC").replace(/,/g, "").trim();
  if (!normalized) return 0;
  const number = Number(normalized);
  if (!Number.isFinite(number) || number <= 0) return 0;
  return Math.round(number);
}

export function comparableParkingCount(row = {}) {
  const direct = normalizeComparableParkingCount(row.parkingCount ?? row.parking_count ?? row.parking_count_value);
  if (direct > 0) return direct;
  const candidates = [
    row.tradeCount,
    row.rawTradeCount,
    row.note,
    row.target,
    row.rawTarget
  ].map((value) => String(value ?? "").normalize("NFKC").replace(/\s+/g, ""));
  const patterns = [
    /(?:官方)?車位數量[=:：]?(\d+)/,
    /車(\d+)/,
    /(?:車位|停車位)(?:數量|共計|共)?[=:：]?(\d+)(?:個|位)?/
  ];
  for (const text of candidates) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      const count = normalizeComparableParkingCount(match?.[1]);
      if (count > 0) return count;
    }
  }
  return 0;
}

export function comparableParkingUnitPrice(row = {}) {
  const totalPrice = toNumber(row.parkingPrice);
  if (totalPrice == null || totalPrice <= 0) return null;
  const count = comparableParkingCount(row);
  return +(totalPrice / Math.max(1, count)).toFixed(3);
}

export function averageComparableParkingUnitPrice(rows = []) {
  const values = rows
    .map((row) => comparableParkingUnitPrice(row))
    .filter((value) => value != null && Number.isFinite(value) && value > 0);
  if (!values.length) return null;
  return +(values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3);
}

export function parkingValuationMultiplier(parkingInfo = {}, parkingCountValue = 0) {
  const explicitCount = normalizeComparableParkingCount(parkingCountValue);
  if (explicitCount > 0) return explicitCount;
  const infoCount = normalizeComparableParkingCount(parkingInfo.count);
  if (infoCount > 0) return infoCount;
  const multiplier = Number(parkingInfo.priceMultiplier);
  return Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 0;
}

export function estimateHouseValueWithParking({
  valuationBasePing = 0,
  averageUnitPrice = 0,
  parkingUnitPrice = 0,
  parkingMultiplier = 0,
  isTownhouse = false
} = {}) {
  const basePing = toNumber(valuationBasePing) ?? 0;
  const unitPrice = toNumber(averageUnitPrice) ?? 0;
  const singleParkingPrice = toNumber(parkingUnitPrice) ?? 0;
  const multiplier = toNumber(parkingMultiplier) ?? 0;
  const parkingValue = isTownhouse ? 0 : Math.max(0, singleParkingPrice) * Math.max(0, multiplier);
  return +(basePing * unitPrice + parkingValue).toFixed(3);
}

export function readAreaInfoFromDom(els) {
  return calculateAreaInfo({
    main: els.mainArea?.value,
    attach: els.attachArea?.value,
    common: els.commonArea?.value,
    other: els.otherArea?.value,
    landShare: els.landShareArea?.value,
    parking: els.parkingArea?.value
  });
}
