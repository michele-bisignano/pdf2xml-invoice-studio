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
  invalidFieldLabels: string[];
}

/**
 * Common country name to ISO 3166-1 alpha-2 mapping.
 */
export const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  italia: "IT",
  italy: "IT",
  slovacchia: "SK",
  slovakia: "SK",
  germania: "DE",
  germany: "DE",
  deutschland: "DE",
  francia: "FR",
  france: "FR",
  spagna: "ES",
  spain: "ES",
  irlanda: "IE",
  ireland: "IE",
  austria: "AT",
  olanda: "NL",
  netherlands: "NL",
  paesibassi: "NL",
  belgio: "BE",
  belgium: "BE",
  svizzera: "CH",
  switzerland: "CH",
  polonia: "PL",
  poland: "PL",
  portogallo: "PT",
  portugal: "PT",
  romania: "RO",
  repubblicaceca: "CZ",
  czechia: "CZ",
  grecia: "GR",
  greece: "GR",
  cipro: "CY",
  cyprus: "CY",
  bulgaria: "BG",
  croazia: "HR",
  croatia: "HR",
  slovenia: "SI",
  svezia: "SE",
  sweden: "SE",
  finlandia: "FI",
  finland: "FI",
  danimarca: "DK",
  denmark: "DK",
  estonia: "EE",
  lettonia: "LV",
  latvia: "LV",
  lituania: "LT",
  lithuania: "LT",
  lussemburgo: "LU",
  luxembourg: "LU",
  malta: "MT",
  regnounito: "GB",
  uk: "GB",
  granbretagna: "GB",
  statiuniti: "US",
  usa: "US",
};

/**
 * Normalizes a country string (code or full name) into a 2-letter uppercase ISO code.
 */
export function normalizeCountryCode(countryStr: string): string {
  if (!countryStr) return "";
  const clean = countryStr.trim().replace(/[^a-zA-Z]/g, "");
  if (clean.length === 2) {
    return clean.toUpperCase();
  }
  const mapped = COUNTRY_NAME_TO_CODE[clean.toLowerCase()];
  if (mapped) {
    return mapped;
  }
  return countryStr.trim().toUpperCase().slice(0, 2);
}

/**
 * Normalizes date input into YYYY-MM-DD for SDI XML.
 * Accepts YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY.
 */
export function normalizeDateForXml(dateStr: string): string {
  if (!dateStr) return "";
  const clean = dateStr.trim().replace(/[,\s]+/g, " ");

  // Pattern 1: YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const isoMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, "0");
    const d = isoMatch[3].padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

// Pattern 2: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY or DD/MM/YY
  const euMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (euMatch) {
    const d = euMatch[1].padStart(2, "0");
    const m = euMatch[2].padStart(2, "0");
    let y = euMatch[3];
    if (y.length === 2) {
      const yNum = parseInt(y, 10);
      y = yNum >= 70 ? `19${y}` : `20${y}`;
    }
    return `${y}-${m}-${d}`;
  }

  return clean;
}

/**
 * Normalizes an amount string into standard 2-decimal format (e.g. 600.00).
 */
export function normalizeAmountStr(amountStr: string): string {
  if (!amountStr || !amountStr.trim()) return "";
  let clean = amountStr.trim().replace(/[€$£a-zA-Z\s]/g, "");
  if (!clean) return amountStr;

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
  if (isNaN(num)) return amountStr;
  return num.toFixed(2);
}

/**
 * Validates date string in either YYYY-MM-DD or DD/MM/YYYY format with real calendar checks.
 */
export function isValidIsoDate(dateStr: string): boolean {
  if (!dateStr || !dateStr.trim()) return false;
  const clean = dateStr.trim();

  let year: number;
  let month: number;
  let day: number;

  // Check Pattern 1: YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const isoMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    year = parseInt(isoMatch[1], 10);
    month = parseInt(isoMatch[2], 10);
    day = parseInt(isoMatch[3], 10);
  } else {
    // Check Pattern 2: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY or DD/MM/YY
    const euMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
    if (euMatch) {
      day = parseInt(euMatch[1], 10);
      month = parseInt(euMatch[2], 10);
      let yStr = euMatch[3];
      if (yStr.length === 2) {
        const yNum = parseInt(yStr, 10);
        yStr = yNum >= 70 ? `19${yStr}` : `20${yStr}`;
      }
      year = parseInt(yStr, 10);
    } else {
      return false;
    }
  }

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
 * Validates positive financial amount string.
 * Handles European formats (1.250,50 / 1250,50), US formats (1,250.50 / 1250.50),
 * and strips currency symbols (€, $, EUR, etc.).
 */
export function isValidAmount(amountStr: string): boolean {
  if (!amountStr || !amountStr.trim()) return false;
  let clean = amountStr.trim().replace(/[€$£a-zA-Z\s]/g, "");
  if (!clean) return false;

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
  return !isNaN(num) && num >= 0;
}

/**
 * Validates VAT or Tax ID format.
 */
export function isValidVat(vatStr: string): boolean {
  if (!vatStr) return false;
  const clean = vatStr.trim().replace(/[\s.-]/g, "");
  return clean.length >= 2 && clean.length <= 30;
}

/**
 * Validates Italian VAT (11 digits, optional IT prefix, or 16-character fiscal code).
 */
export function isValidItalianVat(vatStr: string): boolean {
  if (!vatStr) return false;
  const clean = vatStr.trim().replace(/^IT/i, "").replace(/[\s.-]/g, "");
  return /^\d{11}$/.test(clean) || /^[A-Za-z0-9]{11,16}$/.test(clean);
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
 * Validates 2-letter ISO Country Code or recognized country name.
 */
export function isValidCountry(countryStr: string): boolean {
  if (!countryStr) return false;
  const clean = countryStr.trim().replace(/[^a-zA-Z]/g, "");
  if (/^[A-Za-z]{2}$/.test(clean)) return true;
  return !!COUNTRY_NAME_TO_CODE[clean.toLowerCase()];
}

/**
 * Human-readable field names for validation summary error messages.
 */
export const FIELD_LABELS: Record<Language, Record<keyof InvoiceValidationMap, string>> = {
  IT: {
    supplierName: "Nome Fornitore",
    supplierVat: "Partita IVA / Codice Fornitore",
    supplierCountry: "Nazione Fornitore",
    supplierCap: "CAP Fornitore",
    supplierCity: "Città Fornitore",
    supplierAddress: "Indirizzo Fornitore",
    customerName: "Ragione Sociale Committente",
    customerVat: "Partita IVA Committente",
    customerFiscalCode: "Codice Fiscale Committente",
    customerCountry: "Nazione Committente",
    customerCap: "CAP Committente",
    customerCity: "Comune Committente",
    customerProvince: "Provincia Committente",
    customerAddress: "Indirizzo Committente",
    invoiceNumber: "Numero Fattura",
    invoiceDate: "Data Fattura",
    invoiceAmount: "Importo Fattura",
    invoiceDescription: "Descrizione Fattura",
  },
  EN: {
    supplierName: "Supplier Name",
    supplierVat: "Supplier VAT / Tax ID",
    supplierCountry: "Supplier Country",
    supplierCap: "Supplier Postal Code",
    supplierCity: "Supplier City",
    supplierAddress: "Supplier Address",
    customerName: "Buyer Company Name",
    customerVat: "Buyer VAT Number",
    customerFiscalCode: "Buyer Tax Code",
    customerCountry: "Buyer Country",
    customerCap: "Buyer Postal Code",
    customerCity: "Buyer City",
    customerProvince: "Buyer Province",
    customerAddress: "Buyer Address",
    invoiceNumber: "Invoice Number",
    invoiceDate: "Invoice Date",
    invoiceAmount: "Invoice Amount",
    invoiceDescription: "Invoice Description",
  },
};

/**
 * Comprehensive validator for all invoice fields:
 * - Empty required fields: highlighted in red with "Dato non rilevato"
 * - Empty optional fields: clean idle state (no error)
 * - Fields filled manually or extracted: validated; if valid -> clean idle state without error
 * - Invalid format: highlighted in red with descriptive format message
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

    // 1. If field is empty
    if (!trimmed) {
      if (isOptional) {
        return {
          isValid: true,
          isError: false,
          status: "idle",
          wasExtracted: false,
        };
      }

      // Mandatory field that is currently empty
      return {
        isValid: false,
        isError: hasExtractedFile,
        status: hasExtractedFile ? "error" : "idle",
        message: notDetectedMsg,
        wasExtracted: false,
      };
    }

    // 2. Field has a value: check format validity
    const valid = validator(trimmed);
    if (!valid) {
      let msg = isIt ? "Formato non valido" : "Invalid format";
      if (fieldKey === "invoiceDate") {
        msg = isIt ? "Data non valida (es. 2026-07-08 o 08/07/2026)" : "Invalid date (e.g. 2026-07-08 or 08/07/2026)";
      } else if (fieldKey === "invoiceAmount") {
        msg = isIt ? "Importo numerico non valido (es. 600.00)" : "Invalid numeric amount (e.g. 600.00)";
      } else if (fieldKey === "supplierCountry" || fieldKey === "customerCountry") {
        msg = isIt ? "Codice nazione a 2 lettere (es. IT, SK, DE)" : "2-letter country code (e.g. IT, SK, DE)";
      } else if (fieldKey === "customerVat" || fieldKey === "supplierVat") {
        msg = isIt ? "Partita IVA / Codice non valido" : "Invalid VAT / Tax ID";
      }

      return {
        isValid: false,
        isError: true,
        status: "error",
        message: msg,
        wasExtracted,
      };
    }

    // 3. Valid: standard clean state
    return {
      isValid: true,
      isError: false,
      status: "idle",
      wasExtracted: wasExtracted || isUserEdited,
    };
  };

  const fields: InvoiceValidationMap = {
    // Supplier fields
    supplierName: evaluate("supplierName", supplier.name, (v) => v.length >= 1),
    supplierVat: evaluate("supplierVat", supplier.vat, (v) => isValidVat(v)),
    supplierCountry: evaluate("supplierCountry", supplier.country, (v) => isValidCountry(v)),
    supplierCap: evaluate("supplierCap", supplier.cap, (v) => !v || (v.length >= 2 && v.length <= 10), true),
    supplierCity: evaluate("supplierCity", supplier.city, (v) => !v || v.length >= 2, true),
    supplierAddress: evaluate("supplierAddress", supplier.address, (v) => !v || v.length >= 3, true),

    // Customer fields (Committente)
    customerName: evaluate("customerName", customer.name, (v) => v.length >= 1),
    customerVat: evaluate("customerVat", customer.vat, (v) => isValidItalianVat(v) || isValidVat(v)),
    customerFiscalCode: evaluate("customerFiscalCode", customer.fiscalCode, (v) => isValidFiscalCode(v), true),
    customerCountry: evaluate("customerCountry", customer.country, (v) => isValidCountry(v)),
    customerCap: evaluate("customerCap", customer.cap, (v) => !v || /^\d{5}$/.test(v) || v.length >= 2, true),
    customerCity: evaluate("customerCity", customer.city, (v) => !v || v.length >= 2, true),
    customerProvince: evaluate("customerProvince", customer.province, (v) => !v || /^[A-Za-z]{2}$/.test(v), true),
    customerAddress: evaluate("customerAddress", customer.address, (v) => !v || v.length >= 3, true),

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
  const invalidFieldLabels: string[] = [];

  // Check required fields
  requiredKeys.forEach((k) => {
    const state = fields[k];
    if (!state.isValid) {
      totalErrors++;
      invalidFieldLabels.push(FIELD_LABELS[language][k]);
    }
  });

  // Check optional fields that have invalid format
  (Object.keys(fields) as (keyof InvoiceValidationMap)[]).forEach((k) => {
    if (!requiredKeys.includes(k) && fields[k].isError) {
      totalErrors++;
      invalidFieldLabels.push(FIELD_LABELS[language][k]);
    }
  });

  const isValid = totalErrors === 0;

  return {
    fields,
    isValid,
    totalErrors,
    totalMissing,
    invalidFieldLabels,
  };
}
