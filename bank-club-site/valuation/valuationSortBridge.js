import {
  comparableRowIsFirstFloor,
  parseLastFloorFromAddress,
  parseTotalFloorsFromFloorInfo,
  parseUnitFloorFromFloorInfo,
  scoreComparable,
  sortComparablesForAverage
} from "./src/valuation/sort.js";
import { formatAddressProximitySortNote } from "./src/valuation/address.js";

window.FoundValuationSort = {
  comparableRowIsFirstFloor,
  formatAddressProximitySortNote,
  parseLastFloorFromAddress,
  parseTotalFloorsFromFloorInfo,
  parseUnitFloorFromFloorInfo,
  scoreComparable,
  sortComparablesForAverage
};

window.dispatchEvent(new CustomEvent("found:valuation-sort-ready"));
