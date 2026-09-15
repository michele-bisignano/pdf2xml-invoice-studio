import { SupplierData, CustomerData, InvoiceData, ExtractionMetaMap, Language } from "../types";

export type FieldStatusType = "error" | "idle";

export interface FieldValidationState {
  isValid: boolean;
  isError: boolean;
  status: FieldStatusType;
  message?: string;
  wasExtracted?: boolean;
}

export type InvoiceValidationMap = Record<
  | "supplierName"
  | "supplierVat"
  | "supplierCountry"
  | "supplierCap"
  | "supplierCity"
  | "supplierAddress"
  | "customerName"
  | "customerVat"
  | "customerFiscalCode"
  | "customerCountry"
  | "customerCap"
  | "customerCity"
  | "customerProvince"
  | "customerAddress"
  | "invoiceNumber"
  | "invoiceDate"
  | "invoiceAmount"
  | "invoiceDescription",
  FieldValidationState
>;

export interface ValidationSummary {
  fields: InvoiceValidationMap;
  isValid: boolean;
  totalErrors: number;
  totalMissing: number;
}

/**
 * Validates date string in YYYY-MM-DD format with real calendar dates.
 */
export function isValidIsoDate(dateStr: string): boolean {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
    return false;
  }
  const [yStr, mStr, dStr] = dateStr.trim().split("-");
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10);
  const day = parseInt(dStr, 10);

  if (year < 1990 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const dateObj = new Date(year, month - 1, day);
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  );
}

/**
 * Validates positive financial amount string (e.g. 600.00, 1.250,50, 1250,50).
 */
export function isValidAmount(amountStr: string): boolean {
  if (!amountStr || !amountStr.trim()) return false;
  let clean = amountStr.trim().replace(/\s/g, "");

  // Detect and normalize European 1.250,50 vs US 1,250.50
  if (clean.includes(".") && clean.includes(",")) {
    if (clean.lastIndexOf(",") > clean.lastIndexOf(".")) {
      clean = clean.replace(/\./g, "").replace(",", ".");
    } else {
      clean = clean.replace(/,/g, "");
    }
  } else if (clean.includes(",")) {
    clean = clean.replace(",", ".");
  }

  const num = parseFloat(clean);
  return !isNaN(num) && num > 0 && /^\d+(\.\d{1,4})?$/.test(clean);
}

/**
 * Validates VAT or Tax ID format.
 */
export function isValidVat(vatStr: string): boolean {
  if (!vatStr) return false;
  const clean = vatStr.trim().replace(/[\s.-]/g, "");
  // Standard EU VAT or foreign Tax ID: 2 to 28 alphanumeric chars (SDI accepts up to 28)
  return clean.length >= 2 && clean.length <= 28 && /^[A-Za-z0-9]+$/.test(clean);
}

/**
 * Validates Italian VAT (11 digits).
 */
export function isValidItalianVat(vatStr: string): boolean {
  if (!vatStr) return false;
  const clean = vatStr.trim().replace(/^IT/i, "").replace(/[\s.-]/g, "");
  return /^\d{11}$/.test(clean);
}

/**
 * Validates Italian Codice Fiscale (16 chars alphanumeric for individuals or 11 digits for entities).
 */
export function isValidFiscalCode(cfStr: string): boolean {
  if (!cfStr) return true; // Optional if VAT provided
  const clean = cfStr.trim().toUpperCase().replace(/[\s.-]/g, "");
  if (!clean) return true;
  return /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/.test(clean) || /^\d{11}$/.test(clean);
}

/**
 * Validates 2-letter ISO Country Code.
 */
export function isValidCountry(countryStr: string): boolean {
  if (!countryStr) return false;
  return /^[A-Za-z]{2}$/.test(countryStr.trim());
}

/**
 * Comprehensive validator for all invoice fields:
 * - Correct fields: DO NOT illuminate, no badge, status: "idle"
 * - Erroneous or missing fields: Highlighted in red with message "Dato non rilevato"
 */
export function validateAllFields(
  supplier: SupplierData,
  customer: CustomerData,
  invoice: InvoiceData,
  hasExtractedFile: boolean,
  extractedMeta?: ExtractionMetaMap,
  language: Language = "IT",
  userEditedFields?: Set<string>
): ValidationSummary {
  const isIt = language === "IT";
  const notDetectedMsg = isIt ? "Dato non rilevato" : "Data not detected";

  // Helper to evaluate a field:
  // If invalid or missing/not detected after extraction, mark as red with "Dato non rilevato"
  // If valid, keep clean idle without green illumination
  const evaluate = (
    fieldKey: keyof InvoiceValidationMap,
    value: string | undefined,
    validator: (v: string) => boolean,
    isOptional: boolean = false
  ): FieldValidationState => {
    const trimmed = (value || "").trim();
    const meta = extractedMeta?.[fieldKey];
    const wasExtracted = meta?.wasExtracted ?? false;
    const isUserEdited = userEditedFields?.has(fieldKey) ?? false;

    // Mode A: A document (PDF/Image) was extracted
    if (hasExtractedFile) {
      // 1. If field is empty: not detected/missing -> flag in RED
      if (!trimmed) {
        return {
          isValid: false,
          isError: true,
          status: "error",
          message: notDetectedMsg,
          wasExtracted: false,
        };
      }

      // 2. If not extracted from the PDF and the user hasn't actively edited it:
      // it was not read from the PDF -> flag in RED
      if (!wasExtracted && !isUserEdited) {
        return {
          isValid: false,
          isError: true,
          status: "error",
          message: notDetectedMsg,
          wasExtracted: false,
        };
      }

      // 3. The field was extracted from the PDF or edited by the user: check format validity
      const valid = validator(trimmed);
      if (!valid) {
        return {
          isValid: false,
          isError: true,
          status: "error",
          message: notDetectedMsg,
          wasExtracted,
        };
      }

      // Valid: standard clean state (no green glow)
      return {
        isValid: true,
        isError: false,
        status: "idle",
        wasExtracted,
      };
    }

    // Mode B: Before extracting any file (fresh or manual entry mode)
    if (!trimmed) {
      if (isOptional) {
        return {
          isValid: true,
          isError: false,
          status: "idle",
          wasExtracted: false,
        };
      }

      return {
        isValid: false,
        isError: false,
        status: "idle",
        wasExtracted: false,
      };
    }

    const valid = validator(trimmed);

    if (!valid) {
      return {
        isValid: false,
        isError: true,
        status: "error",
        message: notDetectedMsg,
        wasExtracted,
      };
    }

    // Valid: plain idle state
    return {
      isValid: true,
      isError: false,
      status: "idle",
      wasExtracted,
    };
  };

  const fields: InvoiceValidationMap = {
    // Supplier fields
    supplierName: evaluate("supplierName", supplier.name, (v) => v.length >= 2),
    supplierVat: evaluate("supplierVat", supplier.vat, (v) => isValidVat(v)),
    supplierCountry: evaluate("supplierCountry", supplier.country, (v) => isValidCountry(v)),
    supplierCap: evaluate("supplierCap", supplier.cap, (v) => v.length >= 2 && v.length <= 10, true),
    supplierCity: evaluate("supplierCity", supplier.city, (v) => v.length >= 2, true),
    supplierAddress: evaluate("supplierAddress", supplier.address, (v) => v.length >= 3, true),

    // Customer fields (Committente)
    customerName: evaluate("customerName", customer.name, (v) => v.length >= 2),
    customerVat: evaluate("customerVat", customer.vat, (v) => isValidItalianVat(v) || isValidVat(v)),
    customerFiscalCode: evaluate("customerFiscalCode", customer.fiscalCode, (v) => isValidFiscalCode(v), true),
    customerCountry: evaluate("customerCountry", customer.country, (v) => isValidCountry(v)),
    customerCap: evaluate("customerCap", customer.cap, (v) => /^\d{5}$/.test(v) || v.length >= 2, true),
    customerCity: evaluate("customerCity", customer.city, (v) => v.length >= 2, true),
    customerProvince: evaluate("customerProvince", customer.province, (v) => !v || /^[A-Za-z]{2}$/.test(v), true),
    customerAddress: evaluate("customerAddress", customer.address, (v) => v.length >= 3, true),

    // Invoice fields
    invoiceNumber: evaluate("invoiceNumber", invoice.invoiceNumber, (v) => v.length >= 1),
    invoiceDate: evaluate("invoiceDate", invoice.invoiceDate, (v) => isValidIsoDate(v)),
    invoiceAmount: evaluate("invoiceAmount", invoice.amount, (v) => isValidAmount(v)),
    invoiceDescription: evaluate("invoiceDescription", invoice.description, () => true, true),
  };

  const requiredKeys: (keyof InvoiceValidationMap)[] = [
    "supplierName",
    "supplierVat",
    "supplierCountry",
    "customerName",
    "customerVat",
    "customerCountry",
    "invoiceNumber",
    "invoiceDate",
    "invoiceAmount",
  ];

  let totalErrors = 0;
  let totalMissing = 0;

  Object.entries(fields).forEach(([key, state]) => {
    const isReq = requiredKeys.includes(key as keyof InvoiceValidationMap);
    if (state.isError && isReq) {
      totalErrors++;
      totalMissing++;
    }
  });

  const isValid = requiredKeys.every((k) => fields[k].isValid);

  return {
    fields,
    isValid,
    totalErrors,
    totalMissing,
  };
}
