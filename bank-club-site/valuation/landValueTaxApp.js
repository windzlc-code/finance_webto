import {
  LAND_VALUE_TAX_DEFAULTS,
  calculateLandValueTax,
  cpiPeriodOptions,
  findCpiIndex,
  formatLandTaxNumber,
  formatTaiwanDollar,
  getLatestCpiPeriod,
  toLandTaxNumber,
} from './landValueTaxCalculator.js?v=20260521-official-tax-formula';
import { PDF_JS_CDN_SRC, PDF_JS_WORKER_SRC, checkBackendOcrHealth, loadScript } from './src/constants.js';
import { extractPdfTextLayerDetailed, ocrPdfFile } from './src/ocr-pdf.js';
import { ocrImageSourceDetailed } from './src/ocr-image.js';
import { parseLandValueTaxDeedText } from './landValueTaxDeedParser.js?v=20260521-original-value-autofill';

const root = document.getElementById('landValueTaxRoot');
const cpiOptions = cpiPeriodOptions();
const latestCpi = getLatestCpiPeriod();

const defaultState = {
  ...LAND_VALUE_TAX_DEFAULTS,
  taxMode: 'general',
  transferYear: String(latestCpi?.year || ''),
  transferMonth: String(latestCpi?.month || ''),
  originalYear: '110',
  originalMonth: '1',
};

function optionLabel(entry) {
  return `${entry.year}年${entry.month}月（${entry.index}）`;
}

function periodOptionsHtml(selectedYear, selectedMonth) {
  const selectedKey = `${String(selectedYear || '').padStart(3, '0')}/${String(selectedMonth || '').padStart(2, '0')}`;
  return cpiOptions.map((entry) => {
    const selected = entry.period === selectedKey ? ' selected' : '';
    return `<option value="${entry.year}-${entry.month}"${selected}>${optionLabel(entry)}</option>`;
  }).join('');
}

function parsePeriodValue(value) {
  const [year, month] = String(value || '').split('-').map((part) => Number(part));
  return { year: Number.isFinite(year) ? year : '', month: Number.isFinite(month) ? month : '' };
}

function formatInputNumber(value) {
  const number = toLandTaxNumber(value);
  return number ? number.toLocaleString('zh-TW') : '';
}

function fieldHtml(id, label, placeholder = '', value = '', extraClass = '') {
  return `
    <label class="land-tax-field ${extraClass}">
      <span>${label}</span>
      <input id="${id}" type="text" inputmode="decimal" value="${value}" placeholder="${placeholder}" autocomplete="off" />
    </label>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function render() {
  if (!root) return;

  root.innerHTML = `
    <div class="land-tax-layout">
      <div class="land-tax-inputs">
        <section class="land-tax-card">
          <div class="land-tax-card-head">
            <h3>上傳土地謄本</h3>
            <span>PDF 文字層優先；不足時才 OCR</span>
          </div>
          <div class="land-tax-upload">
            <label class="land-tax-field land-tax-upload-field">
              <span>土地謄本檔案</span>
              <input id="ltDeedFile" class="land-tax-file" type="file" accept="application/pdf,image/*,.pdf,.png,.jpg,.jpeg,.webp" multiple />
            </label>
            <button id="ltParseDeedBtn" type="button" class="btn btn-ghost">解析土地謄本並帶入</button>
          </div>
          <div id="ltDeedParseLog" class="land-tax-log">尚未上傳土地謄本。</div>
          <div id="ltDeedParseSummary" class="land-tax-parse-summary" hidden></div>
        </section>

        <section class="land-tax-card">
          <div class="land-tax-card-head">
            <h3>基本資料</h3>
            <span>金額單位：元；面積單位：平方公尺</span>
          </div>
          <div class="land-tax-grid">
            <label class="land-tax-field">
              <span>稅率類型</span>
              <select id="ltTaxMode">
                <option value="general">一般用地三級累進稅率</option>
                <option value="selfUse">自用住宅用地 10%</option>
              </select>
            </label>
            ${fieldHtml('ltLandAreaSqm', '土地面積', '例如：123.45')}
            ${fieldHtml('ltRightNumerator', '權利範圍分子', '例如：1', '1')}
            ${fieldHtml('ltRightDenominator', '權利範圍分母', '例如：1', '1')}
            ${fieldHtml('ltTransferUnitValue', '申報移轉現值單價', '元 / 平方公尺')}
            ${fieldHtml('ltTransferTotalValue', '申報移轉現值總額', '有總額時優先使用')}
            ${fieldHtml('ltOriginalUnitValue', '原地價或前次現值單價', '元 / 平方公尺')}
            ${fieldHtml('ltOriginalTotalValue', '原地價或前次現值總額', '有總額時優先使用')}
            ${fieldHtml('ltHoldingYears', '持有年數', '例如：21')}
          </div>
        </section>

        <section class="land-tax-card">
          <div class="land-tax-card-head">
            <h3>物價指數</h3>
            <span>資料來源：cpispl.xls 消費者物價指數</span>
          </div>
          <div class="land-tax-grid land-tax-grid-two">
            <label class="land-tax-field">
              <span>本次移轉年月（參考）</span>
              <select id="ltTransferPeriod">${periodOptionsHtml(defaultState.transferYear, defaultState.transferMonth)}</select>
            </label>
            <label class="land-tax-field">
              <span>前次移轉年月 CPI</span>
              <select id="ltOriginalPeriod">${periodOptionsHtml(defaultState.originalYear, defaultState.originalMonth)}</select>
            </label>
          </div>
          <div class="hint">依官方公式：物價指數調整後原地價或前次移轉現值 = 原地價或前次移轉現值 ×（前次移轉年月 CPI ÷ 100）。</div>
        </section>

        <section class="land-tax-card">
          <div class="land-tax-card-head">
            <h3>扣除項目</h3>
            <span>依實際可扣除資料輸入</span>
          </div>
          <div class="land-tax-grid">
            ${fieldHtml('ltLandImprovementCost', '改良土地費用', '例如：200,000')}
            ${fieldHtml('ltEngineeringBenefitFee', '工程受益費', '例如：50,000')}
            ${fieldHtml('ltLandReadjustmentBurden', '土地重劃負擔', '例如：100,000')}
            ${fieldHtml('ltDonatedLandValue', '無償捐贈土地公告現值', '例如：0')}
          </div>
        </section>

        <div class="land-tax-actions">
          <button id="ltRecalculateBtn" type="button" class="btn btn-main">重新計算</button>
          <button id="ltClearBtn" type="button" class="btn btn-ghost">清空</button>
          <button id="ltRestoreBtn" type="button" class="btn btn-ghost">恢復預設值</button>
        </div>
      </div>

      <aside class="land-tax-result land-tax-card">
        <div class="land-tax-card-head">
          <h3>試算結果</h3>
          <span>實際仍以稽徵機關核定為準</span>
        </div>
        <div class="land-tax-result-main">
          <small>土地增值稅概算</small>
          <strong id="ltTaxAmount">--</strong>
          <span>元</span>
          <div id="ltTaxStatus" class="land-tax-status">請輸入資料後試算</div>
        </div>
        <div class="land-tax-kpi-grid">
          <div><span>有效持分面積</span><strong id="ltEffectiveArea">--</strong></div>
          <div><span>申報移轉現值</span><strong id="ltTransferValue">--</strong></div>
          <div><span>原地價調整後總額</span><strong id="ltAdjustedOriginal">--</strong></div>
          <div><span>物價指數調整</span><strong id="ltCpiRatio">--</strong></div>
          <div><span>可扣除總額</span><strong id="ltDeductions">--</strong></div>
          <div><span>漲價總數額</span><strong id="ltTaxableGain">--</strong></div>
          <div><span>自用住宅用地稅額</span><strong id="ltSelfUseTax">--</strong></div>
          <div><span>一般用地稅額</span><strong id="ltGeneralTax">--</strong></div>
          <div><span>級距／稅率</span><strong id="ltBracket">--</strong></div>
          <div><span>持有年期減徵</span><strong id="ltDiscount">--</strong></div>
        </div>
        <div id="ltWarnings" class="land-tax-warnings"></div>
      </aside>
    </div>
    <p class="land-tax-footnote">本試算結果僅供參考，實際稅額仍以稽徵機關核定為準。</p>
  `;

  bindEvents();
  restoreDefaults();
}

function controls() {
  if (!root) return {};
  return {
    deedFile: root.querySelector('#ltDeedFile'),
    parseDeedBtn: root.querySelector('#ltParseDeedBtn'),
    deedParseLog: root.querySelector('#ltDeedParseLog'),
    deedParseSummary: root.querySelector('#ltDeedParseSummary'),
    taxMode: root.querySelector('#ltTaxMode'),
    landAreaSqm: root.querySelector('#ltLandAreaSqm'),
    rightNumerator: root.querySelector('#ltRightNumerator'),
    rightDenominator: root.querySelector('#ltRightDenominator'),
    transferUnitValue: root.querySelector('#ltTransferUnitValue'),
    transferTotalValue: root.querySelector('#ltTransferTotalValue'),
    originalUnitValue: root.querySelector('#ltOriginalUnitValue'),
    originalTotalValue: root.querySelector('#ltOriginalTotalValue'),
    transferPeriod: root.querySelector('#ltTransferPeriod'),
    originalPeriod: root.querySelector('#ltOriginalPeriod'),
    landImprovementCost: root.querySelector('#ltLandImprovementCost'),
    engineeringBenefitFee: root.querySelector('#ltEngineeringBenefitFee'),
    landReadjustmentBurden: root.querySelector('#ltLandReadjustmentBurden'),
    donatedLandValue: root.querySelector('#ltDonatedLandValue'),
    holdingYears: root.querySelector('#ltHoldingYears'),
  };
}

function deedControls() {
  const c = controls();
  return {
    file: c.deedFile,
    button: c.parseDeedBtn,
    log: c.deedParseLog,
    summary: c.deedParseSummary,
  };
}

function readInput() {
  const c = controls();
  const transfer = parsePeriodValue(c.transferPeriod?.value);
  const original = parsePeriodValue(c.originalPeriod?.value);
  return {
    taxMode: c.taxMode?.value || 'general',
    landAreaSqm: c.landAreaSqm?.value || '',
    rightNumerator: c.rightNumerator?.value || '1',
    rightDenominator: c.rightDenominator?.value || '1',
    transferUnitValue: c.transferUnitValue?.value || '',
    transferTotalValue: c.transferTotalValue?.value || '',
    originalUnitValue: c.originalUnitValue?.value || '',
    originalTotalValue: c.originalTotalValue?.value || '',
    transferYear: transfer.year,
    transferMonth: transfer.month,
    originalYear: original.year,
    originalMonth: original.month,
    landImprovementCost: c.landImprovementCost?.value || '',
    engineeringBenefitFee: c.engineeringBenefitFee?.value || '',
    landReadjustmentBurden: c.landReadjustmentBurden?.value || '',
    donatedLandValue: c.donatedLandValue?.value || '',
    holdingYears: c.holdingYears?.value || '',
  };
}

function setInput(values) {
  const c = controls();
  for (const [key, element] of Object.entries(c)) {
    if (!element) continue;
    if (key === 'deedFile' || key === 'parseDeedBtn' || key === 'deedParseLog' || key === 'deedParseSummary') continue;
    if (key === 'transferPeriod' || key === 'originalPeriod') continue;
    element.value = values[key] ?? '';
  }
  if (c.transferPeriod) c.transferPeriod.value = `${values.transferYear}-${values.transferMonth}`;
  if (c.originalPeriod) c.originalPeriod.value = `${values.originalYear}-${values.originalMonth}`;
}

function periodExists(year, month) {
  const key = `${Number(year)}-${Number(month)}`;
  return cpiOptions.some((entry) => `${entry.year}-${entry.month}` === key);
}

function setDeedLog(message, tone = '') {
  const { log } = deedControls();
  if (!log) return;
  log.textContent = message || '';
  log.dataset.tone = tone || '';
}

function setParseButtonLoading(isLoading) {
  const { button } = deedControls();
  if (!button) return;
  button.disabled = Boolean(isLoading);
  button.textContent = isLoading ? '解析中...' : '解析土地謄本並帶入';
}

async function ensurePdfLibrary() {
  if (!window.pdfjsLib) {
    await loadScript(PDF_JS_CDN_SRC);
  }
  if (window.pdfjsLib?.GlobalWorkerOptions) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_JS_WORKER_SRC;
  }
}

async function ensureBackendOcrAvailable() {
  if (await checkBackendOcrHealth({ refresh: true, timeoutMs: 5000 })) return;
  throw new Error('OCR 後端未連線，請先啟動 8001 OCR 後端；若需圖片補強再啟動 8099 Docker PaddleOCR。');
}

function isPdfFile(file) {
  return /\.pdf$/i.test(file?.name || '') || /pdf/i.test(file?.type || '');
}

function isImageFile(file) {
  return /image\//i.test(file?.type || '') || /\.(png|jpe?g|webp|bmp|gif|tiff?)$/i.test(file?.name || '');
}

function renderDeedParseSummary(result) {
  const { summary } = deedControls();
  if (!summary) return;
  if (!result) {
    summary.hidden = true;
    summary.innerHTML = '';
    return;
  }

  const rows = Object.entries(result.fields || {}).map(([key, item]) => `
    <tr>
      <td>${escapeHtml(item.label || key)}</td>
      <td>${escapeHtml(item.source || '')}</td>
      <td>${escapeHtml(item.raw || '')}</td>
      <td>${escapeHtml(item.value ?? '')}</td>
    </tr>
  `).join('');
  const warnings = (result.warnings || []).map((warning) => `<li>${escapeHtml(warning)}</li>`).join('');
  summary.hidden = false;
  summary.innerHTML = `
    <div class="land-tax-parse-title">土地謄本辨識結果</div>
    ${rows ? `
      <div class="land-tax-parse-table-wrap">
        <table class="land-tax-parse-table">
          <thead><tr><th>欄位</th><th>來源</th><th>raw</th><th>帶入值</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    ` : '<div class="land-tax-parse-empty">未抓到可帶入欄位。</div>'}
    ${warnings ? `<ul class="land-tax-parse-warnings">${warnings}</ul>` : ''}
  `;
}

function parseCurrentTransferPeriod() {
  const c = controls();
  return parsePeriodValue(c.transferPeriod?.value);
}

function applyParsedLandTaxValues(result) {
  const parsed = result?.values || {};
  const current = readInput();
  const next = { ...current };
  const directKeys = [
    'landAreaSqm',
    'rightNumerator',
    'rightDenominator',
    'transferUnitValue',
    'transferTotalValue',
    'originalUnitValue',
    'originalTotalValue',
    'holdingYears',
  ];

  directKeys.forEach((key) => {
    if (parsed[key] !== undefined && parsed[key] !== null && String(parsed[key]).trim() !== '') {
      next[key] = parsed[key];
    }
  });

  if (parsed.originalYear && parsed.originalMonth) {
    if (periodExists(parsed.originalYear, parsed.originalMonth)) {
      next.originalYear = parsed.originalYear;
      next.originalMonth = parsed.originalMonth;
    } else {
      result.warnings = result.warnings || [];
      result.warnings.push(`原地價年月 ${parsed.originalYear}年${parsed.originalMonth}月不在 CPI 資料內，未自動帶入。`);
    }
  }

  setInput(next);
  updateResults();
}

function mergeParseTexts(...texts) {
  return texts
    .filter((text) => text && String(text).trim())
    .join('\n\n');
}

async function parsePdfLandTaxDeed(file) {
  await ensurePdfLibrary();
  setDeedLog('正在讀取 PDF 文字層...');
  const textLayer = await extractPdfTextLayerDetailed(file, { maxPages: 12 });
  let result = parseLandValueTaxDeedText(textLayer.text, {
    source: textLayer.source,
    transferPeriod: parseCurrentTransferPeriod(),
  });
  if (result.hasCoreData) {
    result.source = textLayer.source;
    return result;
  }

  setDeedLog('PDF 文字層不足，改用前 2 頁 OCR...');
  await ensureBackendOcrAvailable();
  const ocrText = await ocrPdfFile(file, { maxPages: 2 });
  result = parseLandValueTaxDeedText(mergeParseTexts(textLayer.text, ocrText), {
    source: 'pdfTextLayer+ocrBackend',
    transferPeriod: parseCurrentTransferPeriod(),
  });
  if (!result.hasCoreData) {
    result.warnings = result.warnings || [];
    result.warnings.push('PDF 文字層與 OCR 都未抓到足夠欄位，請手動檢查謄本清晰度。');
  }
  return result;
}

async function parseImageLandTaxDeed(file) {
  await ensureBackendOcrAvailable();
  setDeedLog('正在進行圖片 OCR...');
  const detailed = await ocrImageSourceDetailed(file, '土地謄本 OCR', { ocrLayout: 'fullPage' });
  const result = parseLandValueTaxDeedText(detailed?.text || '', {
    source: detailed?.source || 'ocrBackend',
    transferPeriod: parseCurrentTransferPeriod(),
  });
  if (!result.hasCoreData) {
    result.warnings = result.warnings || [];
    result.warnings.push('圖片 OCR 未抓到足夠欄位，請確認上傳的是土地謄本且影像清晰。');
  }
  return result;
}

async function parseAndApplyLandTaxDeedFile(file) {
  if (!file) {
    setDeedLog('請先選擇土地謄本檔案。', 'warn');
    return null;
  }

  setParseButtonLoading(true);
  renderDeedParseSummary(null);
  try {
    const result = isPdfFile(file)
      ? await parsePdfLandTaxDeed(file)
      : isImageFile(file)
        ? await parseImageLandTaxDeed(file)
        : null;
    if (!result) {
      setDeedLog('不支援的檔案格式，請上傳 PDF 或圖片。', 'warn');
      return null;
    }

    applyParsedLandTaxValues(result);
    renderDeedParseSummary(result);
    const filledCount = Object.keys(result.values || {}).length;
    setDeedLog(
      result.hasCoreData
        ? `土地謄本解析完成，已帶入 ${filledCount} 個欄位。`
        : '土地謄本解析完成，但未取得足夠欄位，請人工檢查。',
      result.hasCoreData ? 'ok' : 'warn'
    );
    return result;
  } catch (error) {
    console.error(error);
    setDeedLog(`土地謄本解析失敗：${error?.message || error}`, 'warn');
    return null;
  } finally {
    setParseButtonLoading(false);
  }
}

async function parseAndApplyLandTaxDeedFiles(files) {
  const list = Array.from(files || []).filter(Boolean);
  if (!list.length) {
    setDeedLog('請先選擇土地謄本檔案。', 'warn');
    return null;
  }
  let lastResult = null;
  for (let index = 0; index < list.length; index += 1) {
    const file = list[index];
    setDeedLog(`正在解析土地謄本 ${index + 1}/${list.length}：${file.name || '未命名檔案'}...`);
    const result = await parseAndApplyLandTaxDeedFile(file);
    lastResult = result || lastResult;
    if (result?.hasCoreData) return result;
  }
  return lastResult;
}

function updateResults() {
  const result = calculateLandValueTax(readInput());
  const byId = (id) => root.querySelector(`#${id}`);
  byId('ltTaxAmount').textContent = formatTaiwanDollar(result.tax);
  byId('ltEffectiveArea').textContent = `${formatLandTaxNumber(result.effectiveAreaSqm, 2)} ㎡ / ${formatLandTaxNumber(result.effectiveAreaPing, 3)} 坪`;
  byId('ltTransferValue').textContent = `${formatTaiwanDollar(result.transferValue)} 元`;
  byId('ltAdjustedOriginal').textContent = `${formatTaiwanDollar(result.adjustedOriginalValue)} 元`;
  byId('ltCpiRatio').textContent = result.transferPeriod && result.originalPeriod
    ? `${formatLandTaxNumber(result.cpiRatio, 4)} 倍`
    : '--';
  byId('ltDeductions').textContent = `${formatTaiwanDollar(result.totalDeductions)} 元`;
  byId('ltTaxableGain').textContent = `${formatTaiwanDollar(result.taxableGain)} 元`;
  byId('ltSelfUseTax').textContent = `${formatTaiwanDollar(result.selfUseTax)} 元`;
  byId('ltGeneralTax').textContent = `${formatTaiwanDollar(result.generalTax)} 元`;
  byId('ltBracket').textContent = result.bracket;
  byId('ltDiscount').textContent = result.holdingDiscountRate
    ? `${Math.round(result.holdingDiscountRate * 100)}%`
    : '無';

  const status = byId('ltTaxStatus');
  if (!result.taxableGain && (result.transferValue || result.originalValue)) {
    status.textContent = '無漲價數額';
    status.className = 'land-tax-status land-tax-status-ok';
  } else if (result.warnings.length) {
    status.textContent = '資料未完整';
    status.className = 'land-tax-status land-tax-status-warn';
  } else {
    status.textContent = '已完成試算';
    status.className = 'land-tax-status land-tax-status-ok';
  }

  const warningBox = byId('ltWarnings');
  warningBox.innerHTML = result.warnings.length
    ? result.warnings.map((warning) => `<div>${warning}</div>`).join('')
    : '';
}

function restoreDefaults() {
  setInput(defaultState);
  updateResults();
}

function clearAll() {
  const blank = {
    ...LAND_VALUE_TAX_DEFAULTS,
    taxMode: 'general',
    transferYear: latestCpi?.year || '',
    transferMonth: latestCpi?.month || '',
  };
  setInput(blank);
  updateResults();
}

function normalizeMoneyInputs(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== 'text') return;
  const id = input.id || '';
  if (!/^lt(Transfer|Original|LandImprovement|Engineering|LandReadjustment|Donated)/.test(id)) return;
  input.value = formatInputNumber(input.value);
}

function bindEvents() {
  root.querySelectorAll('input, select').forEach((element) => {
    element.addEventListener('input', updateResults);
    element.addEventListener('change', updateResults);
    element.addEventListener('blur', normalizeMoneyInputs);
  });
  root.querySelector('#ltDeedFile')?.addEventListener('change', (event) => {
    const files = Array.from(event.target?.files || []);
    if (files.length) parseAndApplyLandTaxDeedFiles(files);
  });
  root.querySelector('#ltParseDeedBtn')?.addEventListener('click', () => {
    const files = Array.from(root.querySelector('#ltDeedFile')?.files || []);
    parseAndApplyLandTaxDeedFiles(files);
  });
  root.querySelector('#ltRecalculateBtn')?.addEventListener('click', updateResults);
  root.querySelector('#ltClearBtn')?.addEventListener('click', clearAll);
  root.querySelector('#ltRestoreBtn')?.addEventListener('click', restoreDefaults);
}

if (root) {
  render();
  window.LandValueTaxCalculator = {
    calculateLandValueTax,
    findCpiIndex,
    parseAndApplyLandTaxDeedFile,
    parseAndApplyLandTaxDeedFiles,
    latestCpi,
  };
  window.LandValueTaxDeedParser = {
    parseLandValueTaxDeedText,
  };
}
