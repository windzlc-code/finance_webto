import { CITY_DISTRICTS, RE_ADDR_ROAD_OPTIONAL_SECTION } from "../constants.js";
import {
  cleanOcrText,
  normalizeFullWidthDigitsToAscii,
  normalizeText,
  parseFloorLevelToken
} from "../utils.js";

export function stripVillageNeighborhoodPrefix(text) {
  let normalized = cleanOcrText(text).replace(/\s+/g, "");
  normalized = normalized.replace(/^[\u4e00-\u9fff]{1,12}(?:里|村)/u, "");
  normalized = normalized.replace(/^\d{1,3}鄰/u, "");
  return normalized;
}

export function stripLeadingCityToken(text) {
  let normalized = cleanOcrText(text || "").replace(/\s+/g, "");
  if (!normalized) return "";
  const cities = Object.keys(CITY_DISTRICTS)
    .flatMap((city) => [city, city.replace(/^臺/, "台"), city.replace(/^台/, "臺")])
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  for (const city of cities) {
    if (normalized.startsWith(city)) {
      normalized = normalized.slice(city.length);
      break;
    }
  }
  const districts = [...new Set(Object.values(CITY_DISTRICTS).flat())]
    .sort((a, b) => b.length - a.length);
  for (const district of districts) {
    if (normalized.startsWith(district)) return normalized.slice(district.length);
  }
  return normalized;
}

export function isBadRoadCandidate(road) {
  const normalized = cleanOcrText(road).replace(/\s+/g, "");
  if (!normalized) return true;
  if (/謄本|網路|網際網路|電子|線上|申請|下載|列印|地政|事務所/.test(normalized)) return true;
  return false;
}

/** 手動查詢「道路名稱」欄：只取至 路／街／大道 與其後可選之「○段」為止，不含巷弄號 */
export function extractRoadThruSectionOnly(address) {
  const normalized = stripVillageNeighborhoodPrefix(stripLeadingCityToken(cleanOcrText(address || ""))).replace(/\s+/g, "");
  if (!normalized) return "";
  const pattern = new RegExp(`([\\u4e00-\\u9fff]{1,16}(?:路|街|大道)${RE_ADDR_ROAD_OPTIONAL_SECTION})`, "gu");
  for (const match of normalized.matchAll(pattern)) {
    const road = match[1];
    if (!isBadRoadCandidate(road)) return road;
  }
  return "";
}

export function stripLeadingKnownAdminArea(value) {
  let text = String(value || "");
  const cityNames = Object.keys(CITY_DISTRICTS).flatMap((city) => [city, city.replace(/^臺/, "台"), city.replace(/^台/, "臺")]);
  for (const city of [...new Set(cityNames)].sort((a, b) => b.length - a.length)) {
    if (city && text.startsWith(city)) {
      text = text.slice(city.length);
      break;
    }
  }
  const districts = [...new Set(Object.values(CITY_DISTRICTS).flat())].sort((a, b) => b.length - a.length);
  for (const district of districts) {
    if (district && text.startsWith(district)) {
      text = text.slice(district.length);
      break;
    }
  }
  return text;
}

export function normalizeDoorplateForMatch(address) {
  let text = normalizeFullWidthDigitsToAscii(cleanOcrText(address || ""))
    .replace(/\s+/g, "")
    .replace(/臺/g, "台")
    .replace(/[，,、。．.]/g, "");
  if (!text) return "";
  text = stripVillageNeighborhoodPrefix(text);
  text = stripLeadingKnownAdminArea(text);
  text = text.replace(/([一二三四五六七八九十百千壹]+)(?=樓|層)/gu, (match) => {
    const n = parseFloorLevelToken(match);
    return n != null ? String(n) : match;
  });
  text = text.replace(/之([一二三四五六七八九十百千壹]+)/gu, (_, token) => {
    const n = parseFloorLevelToken(token);
    return n != null ? `之${n}` : `之${token}`;
  });
  return text;
}

export function normalizeAddressProximityText(value) {
  return normalizeFullWidthDigitsToAscii(cleanOcrText(value || ""))
    .replace(/\s+/g, "")
    .replace(/臺/g, "台")
    .replace(/[，,、。．.]/g, "");
}

export function parseComparableAddressParts(address) {
  const normalized = stripLeadingKnownAdminArea(stripVillageNeighborhoodPrefix(normalizeAddressProximityText(address)));
  if (!normalized) return { normalized: "", road: "", lane: "", alley: "" };
  const road = normalizeText(extractRoadThruSectionOnly(normalized) || "");
  const roadStart = road ? normalized.indexOf(road) : -1;
  const addressAfterRoad = roadStart >= 0 ? normalized.slice(roadStart + road.length) : normalized;
  const lane = (addressAfterRoad.match(/(\d+)巷/) || normalized.match(/(\d+)巷/) || [])[1] || "";
  const alley = (addressAfterRoad.match(/(\d+)弄/) || normalized.match(/(\d+)弄/) || [])[1] || "";
  return { normalized, road, lane, alley };
}

export function addressProximityRank(rowAddress, subjectParts) {
  const subject = subjectParts && subjectParts.road ? subjectParts : null;
  if (!subject) return 0;
  const row = parseComparableAddressParts(rowAddress);
  if (!row.road || row.road !== subject.road) return 3;
  if (!subject.lane) return 0;
  if (row.lane === subject.lane) {
    if (!subject.alley) return 0;
    return row.alley === subject.alley ? 0 : 1;
  }
  return 2;
}

export function formatAddressProximitySortNote(subjectAddress) {
  const parts = parseComparableAddressParts(subjectAddress);
  if (!parts.road) return "地址接近度略過（未取得可比對的標的道路）。";
  const levels = parts.lane
    ? (parts.alley ? "同路同巷同弄 → 同路同巷 → 同路" : "同路同巷 → 同路")
    : "同路";
  const basis = [parts.road, parts.lane ? `${parts.lane}巷` : "", parts.alley ? `${parts.alley}弄` : ""].filter(Boolean).join("");
  return `地址接近度以標的「${basis}」比對，優先順序為 ${levels}。`;
}

export function deriveDistrict(address) {
  const match = String(address || "").match(/.+?[市縣]([^市區鄉鎮]+[區鄉鎮市])/);
  return match ? match[1] : "";
}

export function deriveRoad(address) {
  const parsed = parseComparableAddressParts(address);
  if (parsed.road) return parsed.road;
  const match = String(address || "").match(/([^0-9０-９]+(?:路|街|大道|巷|段))/);
  return match ? normalizeText(match[1]) : "";
}

export function deriveCommunity(address) {
  const normalized = String(address || "").trim();
  const floorMatch = normalized.match(/(.+?(?:號|弄|巷).+?(?:樓(?:之\d+)?))/);
  if (floorMatch) return floorMatch[1];
  const doorMatch = normalized.match(/(.+?(?:號|弄|巷))/);
  return doorMatch ? doorMatch[1] : normalized;
}
