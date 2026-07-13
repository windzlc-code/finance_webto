import { compactOcrText } from "../utils.js";

export function sliceCompactSection(source, startPatterns, endPatterns) {
  const compact = compactOcrText(source);
  if (!compact) return "";
  const starts = startPatterns.map((pattern) => compact.search(pattern)).filter((index) => index >= 0);
  if (!starts.length) return "";
  const start = Math.min(...starts);
  const tail = compact.slice(start);
  const ends = endPatterns
    .map((pattern) => {
      const index = tail.search(pattern);
      return index > 0 ? index : -1;
    })
    .filter((index) => index >= 0);
  const end = ends.length ? Math.min(...ends) : tail.length;
  return tail.slice(0, end);
}
