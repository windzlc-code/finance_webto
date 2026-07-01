import "server-only";

type Detection = {
  blocked: boolean;
  reasons: string[];
};

const taiwanIdPattern = /\b[A-Z][12]\d{8}\b/i;
const passportLikePattern = /(?:護照|passport)[^\n]{0,24}\b[A-Z0-9]{7,12}\b/i;
const accountPattern = /(?:銀行帳號|銀行帳戶|存摺|帳號|帳戶|account)[^\n]{0,32}\d(?:[\s-]?\d){8,}/i;
const sensitiveDocumentPattern = /(?:身分證|身份證|財力證明|薪轉|扣繳憑單|報稅資料|銀行流水|存摺影本)[^\n]{0,80}(?:\d{4,}|[A-Z][12]\d{8})/i;

function hasDenseFinancialRows(value: string) {
  const sensitiveHeading = /(?:薪轉明細|扣繳憑單|報稅資料|銀行流水|財力證明)/i.test(value);
  if (!sensitiveHeading) return false;
  const moneyLikeValues = value.match(/\b\d{4,9}\b/g) || [];
  return moneyLikeValues.length >= 4;
}

export function detectSensitiveLeadNote(value: string): Detection {
  const text = value.trim();
  const reasons: string[] = [];

  if (taiwanIdPattern.test(text)) reasons.push("身分證字號");
  if (passportLikePattern.test(text)) reasons.push("護照號碼");
  if (accountPattern.test(text)) reasons.push("銀行帳號或存摺帳戶");
  if (sensitiveDocumentPattern.test(text)) reasons.push("敏感文件明細");
  if (hasDenseFinancialRows(text)) reasons.push("完整財力或流水明細");

  return {
    blocked: reasons.length > 0,
    reasons,
  };
}

