(function () {
  const FIELD_ALIASES = {
    propertyAddress: ["建物門牌", "門牌", "建物門牌地址"],
    mainArea: ["總面積", "層次面積", "主建物面積", "主建物", "建物面積"],
    attachArea: ["附屬建物用途", "附屬建物面積", "附屬建物", "附屬"],
    commonArea: ["共有部分", "共有部份"],
    landShare: ["土地標示部", "土地面積", "地積", "權利範圍"],
    floor: ["層次", "樓層"],
    totalFloors: ["層數", "總樓層", "總樓層數"],
    purpose: ["主要用途"],
    completionDate: ["建築完成日期"]
  };

  function normalizeText(text) {
    return String(text || "").replace(/[：:]/g, ":").replace(/\s+/g, "");
  }

  function fuzzyIncludes(source, aliases) {
    const s = normalizeText(source);
    return aliases.some((alias) => s.includes(normalizeText(alias)));
  }

  function pairFieldsByNearbyBbox(ocrBlocks, aliases = FIELD_ALIASES) {
    const pairs = {};
    const words = Array.isArray(ocrBlocks) ? ocrBlocks : [];
    for (const [field, names] of Object.entries(aliases)) {
      const label = words.find((word) => fuzzyIncludes(word.text || "", names));
      if (!label?.bbox) continue;
      const candidates = words
        .filter((word) => word !== label && word.bbox)
        .map((word) => {
          const dx = Math.max(0, word.bbox.x0 - label.bbox.x1);
          const dy = Math.abs(((word.bbox.y0 + word.bbox.y1) / 2) - ((label.bbox.y0 + label.bbox.y1) / 2));
          return { word, score: dx + dy * 1.8 };
        })
        .sort((a, b) => a.score - b.score);
      if (candidates[0]) pairs[field] = candidates[0].word.text;
    }
    return pairs;
  }

  window.DeedParser = {
    FIELD_ALIASES,
    normalizeText,
    fuzzyIncludes,
    pairFieldsByNearbyBbox
  };
})();
