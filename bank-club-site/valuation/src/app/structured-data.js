export function writeJsonScript(scriptNode, value) {
  if (!scriptNode) return;
  scriptNode.textContent = JSON.stringify(value, null, 2);
}

export function createEmptyStructuredGraph() {
  return { "@context": "https://schema.org", "@graph": [] };
}

export function writeSearchDataset(scriptNode, dataset) {
  writeJsonScript(scriptNode, dataset);
}
