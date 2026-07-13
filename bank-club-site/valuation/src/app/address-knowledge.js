const ROAD_DICTIONARY_URL = "data/taiwan-road-dictionary.json";
const ADMIN_DISTRICTS_URL = "data/taiwan-admin-districts.json";

let addressKnowledgePromise = null;

function normalizeFullWidthAscii(value) {
  return String(value ?? "").replace(/[！-～]/g, (char) => {
    return String.fromCharCode(char.charCodeAt(0) - 0xfee0);
  });
}

export function normalizeAddressKnowledgeText(value) {
  return normalizeFullWidthAscii(value)
    .replace(/\s+/g, "")
    .replace(/臺/g, "台")
    .replace(/[，,、。．.：:；;()（）【】\[\]"'「」]/g, "");
}

function normalizeCity(value) {
  return String(value || "").trim().replace(/^台/, "臺");
}

function cleanToken(value) {
  return String(value || "").trim().replace(/\s+/g, "");
}

function uniq(items) {
  return [...new Set(items.filter(Boolean))];
}

function sortLongestFirst(items) {
  return [...items].sort((a, b) => b.length - a.length || a.localeCompare(b, "zh-Hant"));
}

function normalizeRoadKey(value) {
  return normalizeAddressKnowledgeText(value);
}

function addToMapSet(map, key, value) {
  if (!key || !value) return;
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(value);
}

function entriesToRoadList(entries) {
  return sortLongestFirst(uniq(entries.map((entry) => entry.road).filter((road) => cleanToken(road).length >= 2)));
}

function makeEmptyIndex() {
  return {
    ok: false,
    version: 0,
    generatedAt: "",
    entries: [],
    cities: {},
    cityNames: [],
    districtNames: [],
    cityByDistrict: new Map(),
    entriesByRoad: new Map(),
    entriesByRoadCity: new Map(),
    entriesByRoadCityDistrict: new Map(),
    roadList: [],
    roadListByCity: new Map(),
    roadListByCityDistrict: new Map()
  };
}

export function createAddressKnowledgeIndex({ roadDictionary = {}, adminDistricts = {} } = {}) {
  const rawEntries = Array.isArray(roadDictionary.entries) ? roadDictionary.entries : [];
  const entries = rawEntries
    .map((entry) => ({
      city: normalizeCity(entry.city),
      district: cleanToken(entry.district),
      road: cleanToken(entry.road),
      source: entry.source || ""
    }))
    .filter((entry) => entry.city && entry.district && entry.road);
  const cities = adminDistricts.cities && typeof adminDistricts.cities === "object"
    ? adminDistricts.cities
    : {};
  const index = makeEmptyIndex();
  index.ok = entries.length > 0;
  index.version = roadDictionary.version || 1;
  index.generatedAt = roadDictionary.generatedAt || adminDistricts.generatedAt || "";
  index.entries = entries;
  index.cities = cities;
  index.cityNames = sortLongestFirst(uniq([
    ...Object.keys(cities).map(normalizeCity),
    ...entries.map((entry) => entry.city)
  ]));
  index.districtNames = sortLongestFirst(uniq([
    ...Object.values(cities).flat().map(cleanToken),
    ...entries.map((entry) => entry.district)
  ]));

  for (const [cityRaw, districtsRaw] of Object.entries(cities)) {
    const city = normalizeCity(cityRaw);
    for (const district of districtsRaw || []) {
      addToMapSet(index.cityByDistrict, cleanToken(district), city);
    }
  }
  for (const entry of entries) {
    addToMapSet(index.cityByDistrict, entry.district, entry.city);
    const roadKey = normalizeRoadKey(entry.road);
    const cityKey = `${roadKey}|${entry.city}`;
    const cityDistrictKey = `${roadKey}|${entry.city}|${entry.district}`;
    if (!index.entriesByRoad.has(roadKey)) index.entriesByRoad.set(roadKey, []);
    if (!index.entriesByRoadCity.has(cityKey)) index.entriesByRoadCity.set(cityKey, []);
    if (!index.entriesByRoadCityDistrict.has(cityDistrictKey)) index.entriesByRoadCityDistrict.set(cityDistrictKey, []);
    index.entriesByRoad.get(roadKey).push(entry);
    index.entriesByRoadCity.get(cityKey).push(entry);
    index.entriesByRoadCityDistrict.get(cityDistrictKey).push(entry);
  }

  index.roadList = entriesToRoadList(entries);
  for (const city of index.cityNames) {
    index.roadListByCity.set(city, entriesToRoadList(entries.filter((entry) => entry.city === city)));
    for (const district of cities[city] || []) {
      const key = `${city}|${district}`;
      index.roadListByCityDistrict.set(key, entriesToRoadList(entries.filter((entry) => entry.city === city && entry.district === district)));
    }
  }
  for (const entry of entries) {
    const key = `${entry.city}|${entry.district}`;
    if (!index.roadListByCityDistrict.has(key)) {
      index.roadListByCityDistrict.set(key, entriesToRoadList(entries.filter((candidate) => candidate.city === entry.city && candidate.district === entry.district)));
    }
  }
  return index;
}

async function fetchJson(url) {
  if (typeof fetch !== "function") throw new Error("fetch unavailable");
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) throw new Error(`address knowledge load failed: ${response.status}`);
  return response.json();
}

export async function loadAddressKnowledge({ refresh = false } = {}) {
  if (!refresh && addressKnowledgePromise) return addressKnowledgePromise;
  addressKnowledgePromise = Promise.all([
    fetchJson(ROAD_DICTIONARY_URL),
    fetchJson(ADMIN_DISTRICTS_URL)
  ])
    .then(([roadDictionary, adminDistricts]) => createAddressKnowledgeIndex({ roadDictionary, adminDistricts }))
    .catch((error) => {
      console.warn("[address-knowledge] 本機地址字典載入失敗，改用既有規則。", error);
      return makeEmptyIndex();
    });
  return addressKnowledgePromise;
}

export function preloadAddressKnowledge() {
  return loadAddressKnowledge().catch(() => makeEmptyIndex());
}

export function inferCityByDistrictFromKnowledge(index, district) {
  const cities = index?.cityByDistrict?.get(cleanToken(district)) || new Set();
  return cities.size === 1 ? [...cities][0] : "";
}

export function findLastAdminPairInText(index, text) {
  const source = normalizeAddressKnowledgeText(text);
  if (!index?.ok || !source) return null;
  let last = null;
  for (const city of index.cityNames) {
    const cityKey = normalizeAddressKnowledgeText(city);
    const districts = index.cities[city] || [];
    for (const district of districts) {
      const key = `${cityKey}${normalizeAddressKnowledgeText(district)}`;
      let pos = source.indexOf(key);
      while (pos >= 0) {
        if (!last || pos >= last.pos) last = { city, district, pos };
        pos = source.indexOf(key, pos + key.length);
      }
    }
  }
  return last ? { city: last.city, district: last.district } : null;
}

function findLastDistrictInText(index, text, city = "") {
  const source = normalizeAddressKnowledgeText(text);
  if (!index?.ok || !source) return "";
  const districts = city && index.cities[city]?.length ? index.cities[city] : index.districtNames;
  let last = null;
  for (const district of districts) {
    const key = normalizeAddressKnowledgeText(district);
    const pos = source.lastIndexOf(key);
    if (pos >= 0 && (!last || pos >= last.pos)) last = { district, pos };
  }
  return last?.district || "";
}

function findCityInText(index, text) {
  const source = normalizeAddressKnowledgeText(text);
  if (!index?.ok || !source) return "";
  let last = null;
  for (const city of index.cityNames) {
    const key = normalizeAddressKnowledgeText(city);
    const pos = source.lastIndexOf(key);
    if (pos >= 0 && (!last || pos >= last.pos)) last = { city, pos };
  }
  return last?.city || "";
}

function subjectContextText(text) {
  const source = String(text || "");
  if (!source.trim()) return "";
  const startMatch = source.match(/建物標示部|建物標示|建物門牌|建物坐落地號|標示部/);
  const start = startMatch ? startMatch.index || 0 : 0;
  const scoped = source.slice(start);
  const end = scoped.search(/建物所有權部|建物他項權利部|土地標示部|土地他項權利部|所有權人|權利人|住址|登記次序|他項權利/);
  return end >= 0 ? scoped.slice(0, end) : scoped;
}

export function findRoadEntries(index, road, { city = "", district = "" } = {}) {
  if (!index?.ok || !road) return [];
  const roadKey = normalizeRoadKey(road);
  const normalizedCity = normalizeCity(city);
  const normalizedDistrict = cleanToken(district);
  if (normalizedCity && normalizedDistrict) {
    const byDistrict = index.entriesByRoadCityDistrict.get(`${roadKey}|${normalizedCity}|${normalizedDistrict}`) || [];
    if (byDistrict.length) return byDistrict;
  }
  if (normalizedCity) {
    const byCity = index.entriesByRoadCity.get(`${roadKey}|${normalizedCity}`) || [];
    if (byCity.length) return byCity;
  }
  return index.entriesByRoad.get(roadKey) || [];
}

function roadListFor(index, city = "", district = "") {
  const normalizedCity = normalizeCity(city);
  const normalizedDistrict = cleanToken(district);
  if (normalizedCity && normalizedDistrict) {
    const scoped = index.roadListByCityDistrict.get(`${normalizedCity}|${normalizedDistrict}`);
    if (scoped?.length) return scoped;
  }
  if (normalizedCity) {
    const scoped = index.roadListByCity.get(normalizedCity);
    if (scoped?.length) return scoped;
  }
  return index.roadList;
}

export function findKnownRoadInText(index, text, { city = "", district = "" } = {}) {
  const source = normalizeAddressKnowledgeText(text);
  if (!index?.ok || !source) return "";
  for (const road of roadListFor(index, city, district)) {
    if (source.includes(normalizeRoadKey(road))) return road;
  }
  return "";
}

function uniquePairFromEntries(entries) {
  const pairs = uniq(entries.map((entry) => `${entry.city}|${entry.district}`));
  if (pairs.length !== 1) return null;
  const [city, district] = pairs[0].split("|");
  return { city, district };
}

export function resolveLocationPartsWithAddressKnowledge(index, {
  primaryAddress = "",
  supplementalText = "",
  existingCity = "",
  existingDistrict = "",
  existingRoad = ""
} = {}) {
  if (!index?.ok) return { city: existingCity || "", district: existingDistrict || "", road: existingRoad || "", matched: false };
  const text = [primaryAddress, supplementalText].filter(Boolean).join("\n");
  const subjectText = subjectContextText(text);
  const priorityText = [primaryAddress, subjectText].filter(Boolean).join("\n");
  const priorityPair = findLastAdminPairInText(index, priorityText);
  const fallbackPair = findLastAdminPairInText(index, text);
  let city = normalizeCity(existingCity || priorityPair?.city || findCityInText(index, priorityText));
  let district = cleanToken(existingDistrict || priorityPair?.district || findLastDistrictInText(index, priorityText, city));
  if (!city && district) city = inferCityByDistrictFromKnowledge(index, district);
  if (!city) city = normalizeCity(fallbackPair?.city || findCityInText(index, text));
  if (city && !district) {
    district = findLastDistrictInText(index, priorityText, city)
      || cleanToken(fallbackPair?.district)
      || findLastDistrictInText(index, text, city);
  }

  let road = cleanToken(existingRoad);
  const existingEntries = road ? findRoadEntries(index, road, { city, district }) : [];
  if (!road || !existingEntries.length) {
    road = findKnownRoadInText(index, primaryAddress, { city, district })
      || findKnownRoadInText(index, subjectText, { city, district })
      || findKnownRoadInText(index, supplementalText, { city, district })
      || road;
  }

  const entries = road ? findRoadEntries(index, road, { city, district }) : [];
  if (road && (!city || !district) && entries.length) {
    const scopedPair = uniquePairFromEntries(entries);
    if (scopedPair) {
      city = city || scopedPair.city;
      district = district || scopedPair.district;
    } else if (city && !district) {
      const byCity = entries.filter((entry) => entry.city === city);
      const cityPair = uniquePairFromEntries(byCity);
      if (cityPair) district = cityPair.district;
    }
  }

  return {
    city: city || "",
    district: district || "",
    road: road || "",
    matched: !!road && entries.length > 0,
    ambiguous: !!road && entries.length > 1 && !district
  };
}

function stripKnownAdminPrefix(index, value) {
  let text = cleanToken(value);
  if (!text) return "";
  const city = findCityInText(index, text);
  if (city && normalizeAddressKnowledgeText(text).startsWith(normalizeAddressKnowledgeText(city))) {
    text = text.slice(city.length);
  }
  const district = findLastDistrictInText(index, text, city);
  if (district && normalizeAddressKnowledgeText(text).startsWith(normalizeAddressKnowledgeText(district))) {
    text = text.slice(district.length);
  }
  return text;
}

export function completeDoorplateWithAddressKnowledge(index, doorplate, contextText = "") {
  if (!index?.ok) return "";
  const cleanDoorplate = cleanToken(doorplate);
  if (!cleanDoorplate) return "";
  const parsedPair = findLastAdminPairInText(index, cleanDoorplate);
  if (parsedPair) return cleanDoorplate.replace(/^台/, "臺");
  const tail = stripKnownAdminPrefix(index, cleanDoorplate);
  const resolved = resolveLocationPartsWithAddressKnowledge(index, {
    primaryAddress: tail,
    supplementalText: contextText
  });
  if (!resolved.city || !resolved.district || !resolved.road) return "";
  if (!normalizeAddressKnowledgeText(tail).includes(normalizeRoadKey(resolved.road))) return "";
  return `${resolved.city}${resolved.district}${tail}`.replace(/^台/, "臺");
}
