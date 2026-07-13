(function () {
  const $ = (id) => document.getElementById(id);

  const createRefs = () => ({
    queryTitle: $("queryTitle"), cityName: $("cityName"), districtName: $("districtName"), communityName: $("communityName"), periodStartYear: $("periodStartYear"), periodStartMonth: $("periodStartMonth"), periodEndYear: $("periodEndYear"), periodEndMonth: $("periodEndMonth"), dealTargetPick: document.querySelectorAll("#dealTargetPick input"), priceUnit: $("priceUnit"), areaUnit: $("areaUnit"), priceUnitChoice: document.querySelectorAll('input[name="priceUnitChoice"]'), areaUnitChoice: document.querySelectorAll('input[name="areaUnitChoice"]'), houseAgePreset: $("houseAgePreset"), houseAgeCustomWrap: $("houseAgeCustomWrap"), subjectAddress: $("subjectAddress"), roadKeyword: $("roadKeyword"), totalFloors: $("totalFloors"), houseType: $("houseType"), isTownhouse: $("isTownhouse"), typeQuickPick: document.querySelectorAll("#typeQuickPick input"), mainPurposePick: document.querySelectorAll("#mainPurposePick input"), usageZonePick: document.querySelectorAll("#usageZonePick input"), tradeTarget: $("tradeTarget"), floorFilter: $("floorFilter"), layoutFilter: $("layoutFilter"), totalPriceMin: $("totalPriceMin"), totalPriceMax: $("totalPriceMax"), unitPriceMin: $("unitPriceMin"), unitPriceMax: $("unitPriceMax"), mainAreaMinFilter: $("mainAreaMinFilter"), mainAreaMaxFilter: $("mainAreaMaxFilter"), houseAgeMin: $("houseAgeMin"), houseAgeMax: $("houseAgeMax"), specialKeywords: $("specialKeywords"),
    tabManual: $("tabManual"), tabUpload: $("tabUpload"), toggleManualAdvancedBtn: $("toggleManualAdvancedBtn"), manualAdvanced: $("manualAdvanced"), queryProgress: $("queryProgress"), queryProgressText: $("queryProgressText"), toggleDeedFieldsBtn: $("toggleDeedFieldsBtn"), deedFieldsPanel: $("deedFieldsPanel"), recordsPanel: $("recordsPanel"), toggleRecordsPanelBtn: $("toggleRecordsPanelBtn"),
    globalActionProgress: $("globalActionProgress"), globalActionProgressText: $("globalActionProgressText"),
    mainArea: $("mainArea"), attachArea: $("attachArea"), commonArea: $("commonArea"), otherArea: $("otherArea"), landShareRaw: $("landShareRaw"), landShareArea: $("landShareArea"), totalAreaOverride: $("totalAreaOverride"), totalWithParkingArea: $("totalWithParkingArea"), parkingArea: $("parkingArea"), parkingCount: $("parkingCount"), parkingUnitPrice: $("parkingUnitPrice"), sourceFile: $("sourceFile"), sourcePreview: $("sourcePreview"), ocrBtn: $("ocrBtn"), ocrProgressBar: $("ocrProgressBar"), ocrProgressText: $("ocrProgressText"), ocrLog: $("ocrLog"), recognizedPropertyAddress: $("recognizedPropertyAddress"), copyPropertyAddressBtn: $("copyPropertyAddressBtn"), sampleBtn: $("sampleBtn"), resetBtn: $("resetBtn"), searchBtn: $("searchBtn"), manualSearchBtn: $("manualSearchBtn"), recalcBtn: $("recalcBtn"), recordsInput: $("recordsInput"), totalAreaDisplay: $("totalAreaDisplay"), usableAreaDisplay: $("usableAreaDisplay"), recordCountDisplay: $("recordCountDisplay"), recordCountDisplayCard: $("recordCountDisplayCard"), areaExplain: $("areaExplain"), avgUnitPrice: $("avgUnitPrice"), avgUnitPriceSub: $("avgUnitPriceSub"), trimmedRange: $("trimmedRange"), trimmedRangeSub: $("trimmedRangeSub"), houseValue: $("houseValue"), houseValueSub: $("houseValueSub"), resultMessage: $("resultMessage"), resultBody: $("resultBody"), calcExplain: $("calcExplain"), dynamicStructuredData: $("dynamicStructuredData"), dynamicSearchDataset: $("dynamicSearchDataset")
  });

  const state = {
    lastSearch: { rows: [], kept: [], removed: [], avg: null, estimate: null },
    lastOcrMapping: {},
    officialCities: [],
    officialTowns: new Map(),
    lastOfficialRawRows: [],
    ocrAbortController: null
  };

  window.AppState = {
    $,
    els: createRefs(),
    state,
    resetSearchState() {
      state.lastSearch = { rows: [], kept: [], removed: [], avg: null, estimate: null };
    },
    resetOcrMapping() {
      state.lastOcrMapping = {};
    }
  };
})();
