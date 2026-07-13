const $ = (id) => document.getElementById(id);

export { $ };

export const els = {
  queryTitle: $("queryTitle"), cityName: $("cityName"), districtName: $("districtName"), communityName: $("communityName"), periodStartYear: $("periodStartYear"), periodStartMonth: $("periodStartMonth"), periodEndYear: $("periodEndYear"), periodEndMonth: $("periodEndMonth"), dealTargetPick: document.querySelectorAll("#dealTargetPick input"), priceUnit: $("priceUnit"), areaUnit: $("areaUnit"), priceUnitChoice: document.querySelectorAll('input[name="priceUnitChoice"]'), areaUnitChoice: document.querySelectorAll('input[name="areaUnitChoice"]'), houseAgePreset: $("houseAgePreset"), houseAgeCustomWrap: $("houseAgeCustomWrap"), subjectAddress: $("subjectAddress"), roadKeyword: $("roadKeyword"), totalFloors: $("totalFloors"), houseType: $("houseType"), isTownhouse: $("isTownhouse"), typeQuickPick: document.querySelectorAll("#typeQuickPick input"), mainPurposePick: document.querySelectorAll("#mainPurposePick input"), usageZonePick: document.querySelectorAll("#usageZonePick input"), tradeTarget: $("tradeTarget"), floorFilter: $("floorFilter"), layoutFilter: $("layoutFilter"), totalPriceMin: $("totalPriceMin"), totalPriceMax: $("totalPriceMax"), unitPriceMin: $("unitPriceMin"), unitPriceMax: $("unitPriceMax"), mainAreaMinFilter: $("mainAreaMinFilter"), mainAreaMaxFilter: $("mainAreaMaxFilter"), houseAgeMin: $("houseAgeMin"), houseAgeMax: $("houseAgeMax"), specialKeywords: $("specialKeywords"), specialModeChoice: document.querySelectorAll('input[name="specialMode"]'),
  tabManual: $("tabManual"), tabUpload: $("tabUpload"), toggleManualAdvancedBtn: $("toggleManualAdvancedBtn"), manualAdvanced: $("manualAdvanced"), queryProgress: $("queryProgress"), queryProgressText: $("queryProgressText"), toggleDeedFieldsBtn: $("toggleDeedFieldsBtn"), deedFieldsPanel: $("deedFieldsPanel"), recordsPanel: $("recordsPanel"), toggleRecordsPanelBtn: $("toggleRecordsPanelBtn"),
  globalActionProgress: $("globalActionProgress"), globalActionProgressText: $("globalActionProgressText"),
  mainArea: $("mainArea"), attachArea: $("attachArea"), commonArea: $("commonArea"), otherArea: $("otherArea"), landShareRaw: $("landShareRaw"), landShareArea: $("landShareArea"), totalAreaOverride: $("totalAreaOverride"), totalWithParkingArea: $("totalWithParkingArea"), parkingArea: $("parkingArea"), parkingCount: $("parkingCount"), parkingUnitPrice: $("parkingUnitPrice"), sourceFile: $("sourceFile"), sourcePreview: $("sourcePreview"), toggleSourcePreviewBtn: $("toggleSourcePreviewBtn"), ocrBtn: $("ocrBtn"), ocrProgressBar: $("ocrProgressBar"), ocrProgressText: $("ocrProgressText"), ocrLog: $("ocrLog"), ocrFieldDiagnostics: $("ocrFieldDiagnostics"), toggleOcrDiagnosticsBtn: $("toggleOcrDiagnosticsBtn"), fieldDetectorStatus: $("fieldDetectorStatus"), fieldDetectorStatusBadge: $("fieldDetectorStatusBadge"), fieldDetectorStatusText: $("fieldDetectorStatusText"), fieldDetectorStatusLinks: $("fieldDetectorStatusLinks"), refreshFieldDetectorStatusBtn: $("refreshFieldDetectorStatusBtn"), recognizedPropertyAddress: $("recognizedPropertyAddress"), copyPropertyAddressBtn: $("copyPropertyAddressBtn"), cathayStatusText: $("cathayStatusText"), cathayStatusBtn: $("cathayStatusBtn"), cathayLoginBtn: $("cathayLoginBtn"), cathaySearchBtn: $("cathaySearchBtn"), cathayAppendMode: $("cathayAppendMode"), sampleBtn: $("sampleBtn"), resetBtn: $("resetBtn"), searchBtn: $("searchBtn"), manualSearchBtn: $("manualSearchBtn"), recalcBtn: $("recalcBtn"), recordsInput: $("recordsInput"), totalAreaDisplay: $("totalAreaDisplay"), parkingAreaDisplay: $("parkingAreaDisplay"), landShareAreaDisplay: $("landShareAreaDisplay"), usableAreaDisplay: $("usableAreaDisplay"), recordCountDisplay: $("recordCountDisplay"), recordCountDisplayCard: $("recordCountDisplayCard"), areaExplain: $("areaExplain"), avgUnitPrice: $("avgUnitPrice"), avgUnitPriceSub: $("avgUnitPriceSub"), trimmedRange: $("trimmedRange"), trimmedRangeSub: $("trimmedRangeSub"), houseValue: $("houseValue"), houseValueSub: $("houseValueSub"), resultMessage: $("resultMessage"), resultBody: $("resultBody"), calcExplain: $("calcExplain"), dynamicStructuredData: $("dynamicStructuredData"), dynamicSearchDataset: $("dynamicSearchDataset")
};

export const specialRemarkEls = {
  toggle: $("specialRemarkToggle"),
  panel: $("specialRemarkPanel"),
  summary: $("specialRemarkSummary"),
  all: $("specialRemarkAll"),
  options: document.querySelectorAll(".special-remark-option")
};

export const mainPurposeEls = {
  toggle: $("mainPurposeToggle"),
  panel: $("mainPurposePanel"),
  summary: $("mainPurposeSummary"),
  all: $("mainPurposeAll"),
  options: document.querySelectorAll("#mainPurposePick input")
};
