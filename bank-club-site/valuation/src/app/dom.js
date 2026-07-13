export const requiredDomIds = [
  "queryTitle",
  "cityName",
  "districtName",
  "periodStartYear",
  "periodStartMonth",
  "periodEndYear",
  "periodEndMonth",
  "subjectAddress",
  "roadKeyword",
  "totalFloors",
  "houseType",
  "isTownhouse",
  "mainArea",
  "attachArea",
  "commonArea",
  "otherArea",
  "landShareRaw",
  "landShareArea",
  "totalAreaOverride",
  "totalWithParkingArea",
  "parkingArea",
  "parkingCount",
  "parkingUnitPrice",
  "priceUnit",
  "areaUnit",
  "communityName",
  "tradeTarget",
  "floorFilter",
  "layoutFilter",
  "totalPriceMin",
  "totalPriceMax",
  "unitPriceMin",
  "unitPriceMax",
  "mainAreaMinFilter",
  "mainAreaMaxFilter",
  "houseAgeMin",
  "houseAgeMax",
  "specialKeywords",
  "tabUpload",
  "tabLandValueTax",
  "uploadTab",
  "landValueTaxTab",
  "mainPurposeToggle",
  "mainPurposePanel",
  "mainPurposeSummary",
  "mainPurposeAll",
  "specialRemarkToggle",
  "specialRemarkPanel",
  "specialRemarkSummary",
  "specialRemarkAll",
  "sourceFile",
  "sourcePreview",
  "ocrBtn",
  "ocrProgressBar",
  "ocrProgressText",
  "ocrLog",
  "toggleSourcePreviewBtn",
  "toggleOcrDiagnosticsBtn",
  "ocrFieldDiagnostics",
  "recognizedPropertyAddress",
  "copyPropertyAddressBtn",
  "resetBtn",
  "searchBtn",
  "manualSearchBtn",
  "recordsInput",
  "recordCountDisplayCard",
  "avgUnitPrice",
  "avgUnitPriceSub",
  "trimmedRange",
  "trimmedRangeSub",
  "houseValue",
  "houseValueSub",
  "loanableAmountCard",
  "loanableAmount",
  "loanableAmountSub",
  "underwritingZone",
  "underwritingZoneSub",
  "underwritingZoneSource",
  "resultMessage",
  "resultBody",
  "calcExplain",
  "dynamicStructuredData",
  "dynamicSearchDataset",
  "toggleManualAdvancedBtn",
  "manualAdvanced",
  "toggleDeedFieldsBtn",
  "deedFieldsPanel",
  "globalActionProgress",
  "globalActionProgressText",
  "queryProgress",
  "queryProgressText"
];

export const optionalDomIds = [
  "totalAreaDisplay",
  "parkingAreaDisplay",
  "usableAreaDisplay",
  "recordCountDisplay",
  "areaExplain",
  "houseAgePreset",
  "houseAgeCustomWrap",
  "tabManual",
  "recordsPanel",
  "toggleRecordsPanelBtn",
  "sampleBtn",
  "recalcBtn"
];

const requiredSelectorGroups = [
  ["dealTargetPick", "#dealTargetPick input"],
  ["typeQuickPick", "#typeQuickPick input"],
  ["mainPurposePick", "#mainPurposePick input"],
  ["priceUnitChoice", 'input[name="priceUnitChoice"]'],
  ["areaUnitChoice", 'input[name="areaUnitChoice"]'],
  ["specialMode", 'input[name="specialMode"]'],
  ["specialRemarkOptions", ".special-remark-option"]
];

export function createDomRefs(doc = document) {
  const refs = {};
  const missing = [];

  for (const id of requiredDomIds) {
    const node = doc.getElementById(id);
    if (!node) {
      missing.push(id);
      continue;
    }
    refs[id] = node;
  }

  if (missing.length > 0) {
    throw new Error(`Missing required DOM nodes: ${missing.join(", ")}`);
  }

  for (const id of optionalDomIds) {
    refs[id] = doc.getElementById(id);
  }

  const missingSelectorGroups = [];
  for (const [name, selector] of requiredSelectorGroups) {
    const nodes = doc.querySelectorAll(selector);
    refs[name] = nodes;
    if (nodes.length === 0) {
      missingSelectorGroups.push(selector);
    }
  }

  if (missingSelectorGroups.length > 0) {
    throw new Error(`Missing required DOM selector groups: ${missingSelectorGroups.join(", ")}`);
  }

  refs.usageZonePick = doc.querySelectorAll("#usageZonePick input");

  return refs;
}
