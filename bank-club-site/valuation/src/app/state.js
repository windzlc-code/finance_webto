export const DEFAULT_RESULT_SORT_KEY = "comparableScore";
export const DEFAULT_RESULT_SORT_DIRECTION = "desc";

export function createAppState() {
  return {
    lastSearch: { rows: [], kept: [], removed: [], avg: null, estimate: null },
    lastOcrMapping: {},
    lastOcrFieldResults: {},
    lastOcrDiagnosticsMeta: {},
    officialCities: [],
    officialTowns: new Map(),
    lastOfficialRawRows: [],
    autoOfficialSearchTimer: null,
    officialSearchInFlight: false,
    resultTableState: {
      rows: [],
      kept: new Set(),
      removed: new Set(),
      sortKey: DEFAULT_RESULT_SORT_KEY,
      sortDirection: DEFAULT_RESULT_SORT_DIRECTION
    }
  };
}
