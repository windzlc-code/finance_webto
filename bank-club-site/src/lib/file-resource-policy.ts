import type { FileResource } from "./types";

export const allowedPublicResourceExtensions = [".txt", ".md", ".csv", ".tsv"] as const;
export const maxPublicResourceUploadBytes = 128 * 1024;
export const maxPublicResourceContentLength = 80_000;

const sensitiveUploadNamePattern =
  /(身分證|身份证|身分証|財力|财力|薪轉|薪转|扣繳|扣缴|存摺|存折|銀行流水|银行流水|報稅|报税|權狀|权状|護照|护照|passport|id\s*card|bank\s*statement)/i;
const sensitiveFileContentPatterns = [
  { label: "身分證字號", pattern: /\b[A-Z][12]\d{8}\b/i },
  { label: "護照號碼", pattern: /(?:護照|passport)[^\n]{0,24}\b[A-Z0-9]{7,12}\b/i },
  { label: "銀行帳號或存摺帳戶", pattern: /(?:銀行帳號|銀行帳戶|存摺|帳號|帳戶|account)[^\n]{0,32}\d(?:[\s-]?\d){8,}/i },
  { label: "敏感文件明細", pattern: /(?:身分證|身份證|財力證明|薪轉|扣繳憑單|報稅資料|銀行流水|存摺影本)[^\n]{0,80}(?:\d{4,}|[A-Z][12]\d{8})/i },
] as const;

export type FileResourceInput = Partial<FileResource> & {
  sourceFilename?: unknown;
  sourceFileMime?: unknown;
  sourceFileSize?: unknown;
};

export function normalizeFileResourceText(value: unknown) {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim() : "";
}

export function normalizeSourceFilename(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/[\\/]/g, "").slice(0, 180) : "";
}

export function normalizeSourceFileMime(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 120) : "";
}

export function normalizeSourceFileSize(value: unknown) {
  const size = Number(value);
  return Number.isFinite(size) && size > 0 ? Math.round(size) : 0;
}

export function hasAllowedPublicResourceExtension(filename: string) {
  const lower = filename.toLowerCase();
  return allowedPublicResourceExtensions.some((extension) => lower.endsWith(extension));
}

export function detectSensitiveFileResourceContent(content: string) {
  const reasons: string[] = sensitiveFileContentPatterns
    .filter(({ pattern }) => pattern.test(content))
    .map(({ label }) => label);
  const hasDenseFinancialRows =
    /(?:薪轉明細|扣繳憑單|報稅資料|銀行流水|財力證明)/i.test(content) &&
    (content.match(/\b\d{4,9}\b/g) || []).length >= 4;
  if (hasDenseFinancialRows) reasons.push("完整財力或流水明細");
  return reasons;
}

export function validateFileResourcePayload(body: FileResourceInput, content: string) {
  const sourceFilename = normalizeSourceFilename(body.sourceFilename);
  const sourceFileSize = normalizeSourceFileSize(body.sourceFileSize);
  const isUploadedImport = Boolean(sourceFilename || sourceFileSize);

  if (!content) return "請輸入文件內容，或匯入公開文字檔";
  if (content.length > maxPublicResourceContentLength) {
    return `文件內容過長，請控制在 ${Math.round(maxPublicResourceContentLength / 1000)}k 字以內`;
  }
  if (content.includes("\0")) return "文件內容包含無效字元，請改用純文字檔";
  const sensitiveContentReasons = detectSensitiveFileResourceContent(content);
  if (sensitiveContentReasons.length) {
    return `此功能僅可管理公開清單與素材文字，敏感個資或財力文件不得上傳網站。偵測到：${sensitiveContentReasons.join("、")}`;
  }

  if (isUploadedImport) {
    if (!sourceFilename) return "匯入文件缺少檔名";
    if (!hasAllowedPublicResourceExtension(sourceFilename)) {
      return `僅支援 ${allowedPublicResourceExtensions.join("、")} 公開文字資源`;
    }
    if (!sourceFileSize || sourceFileSize > maxPublicResourceUploadBytes) {
      return `匯入文件需小於 ${Math.round(maxPublicResourceUploadBytes / 1024)}KB`;
    }
    if (sensitiveUploadNamePattern.test(sourceFilename)) {
      return "此功能僅可匯入公開清單與素材文字，敏感個資或財力文件不得上傳網站";
    }
  }

  return "";
}
