/**
 * Type definitions for Profis Foreign Invoice XML Generator (TD17).
 * Standard: Agenzia delle Entrate FPR12 format.
 */

export interface SupplierData {
  name: string;
  vat: string;
  country: string;
  cap: string;
  city: string;
  address: string;
}

export interface CustomerData {
  name: string;
  vat: string;
  fiscalCode?: string;
  country: string;
  cap: string;
  city: string;
  province?: string;
  address: string;
}

export type DocumentType = "TD17" | "TD18" | "TD19" | "TD16" | "TD01";

export interface DocumentTypeOption {
  code: DocumentType;
  labelIt: string;
  labelEn: string;
  descriptionIt: string;
  descriptionEn: string;
  defaultCountry: string;
  defaultNature: string;
}

export const DOCUMENT_TYPES: DocumentTypeOption[] = [
  {
    code: "TD17",
    labelIt: "TD17 - Acquisto Servizi Estero (Predefinito)",
    labelEn: "TD17 - Foreign Services Purchase (Default)",
    descriptionIt: "Integrazione/autofattura per acquisto di servizi da fornitori esteri (UE o extra-UE)",
    descriptionEn: "Integration/self-invoice for foreign services purchase (EU/non-EU)",
    defaultCountry: "SK",
    defaultNature: "N6.1",
  },
  {
    code: "TD18",
    labelIt: "TD18 - Acquisto Beni Intracomunitari (UE)",
    labelEn: "TD18 - Intra-EU Goods Purchase",
    descriptionIt: "Integrazione per acquisto di beni da Paesi dell'Unione Europea",
    descriptionEn: "Integration for purchase of goods from EU member states",
    defaultCountry: "DE",
    defaultNature: "N6.2",
  },
  {
    code: "TD16",
    labelIt: "TD16 - Reverse Charge Interno (Italia)",
    labelEn: "TD16 - Domestic Reverse Charge (Italy)",
    descriptionIt: "Integrazione fattura per operazioni in reverse charge interno (art.17 c.6)",
    descriptionEn: "Integration for domestic reverse charge transactions (Italy)",
    defaultCountry: "IT",
    defaultNature: "N6.1",
  },
  {
    code: "TD19",
    labelIt: "TD19 - Acquisto Beni da Estero (ex art.17 c.2)",
    labelEn: "TD19 - Goods from Abroad (art.17 c.2)",
    descriptionIt: "Integrazione/autofattura per acquisto beni da fornitori esteri con merce in Italia",
    descriptionEn: "Self-invoice for purchase of goods already in Italy from non-resident suppliers",
    defaultCountry: "CH",
    defaultNature: "N6.1",
  },
  {
    code: "TD01",
    labelIt: "TD01 - Fattura Ordinaria",
    labelEn: "TD01 - Standard Invoice",
    descriptionIt: "Fattura elettronica ordinaria",
    descriptionEn: "Standard electronic invoice",
    defaultCountry: "IT",
    defaultNature: "",
  },
];

export interface InvoiceData {
  documentType: DocumentType;
  invoiceNumber: string;
  invoiceDate: string; // Format: YYYY-MM-DD
  amount: string; // e.g. "600.00"
  currency: string;
  description: string;
  vatRate: string; // e.g. "0.00"
  vatNature: string; // e.g. "N6.1"
  normativeReference: string; // "Inversione contabile"
}

export type Language = "IT" | "EN";
export type Theme = "light" | "dark";

export interface ExtractedFieldMeta {
  wasExtracted: boolean;
  rawExtractedValue?: string;
}

export type ExtractionMetaMap = Partial<Record<
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
  | "customerAddress"
  | "invoiceNumber"
  | "invoiceDate"
  | "invoiceAmount"
  | "invoiceDescription",
  ExtractedFieldMeta
>>;

export interface ExtractedPdfData {
  documentType?: DocumentType;
  detectedDocumentType?: DocumentType;
  supplierName?: string;
  supplierVat?: string;
  supplierCountry?: string;
  supplierCap?: string;
  supplierCity?: string;
  supplierAddress?: string;
  customerName?: string;
  customerVat?: string;
  customerFiscalCode?: string;
  customerCountry?: string;
  customerCap?: string;
  customerCity?: string;
  customerAddress?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceAmount?: string;
  invoiceDescription?: string;
  rawTextPreview?: string;
  extractionMethod?: "digital" | "ocr";
  ocrConfidence?: number;
  extractedFields?: ExtractionMetaMap;
}

export interface FullInvoiceState {
  supplier: SupplierData;
  customer: CustomerData;
  invoice: InvoiceData;
}

/**
 * Default anonymous customer (buyer) data for preview and standalone generation.
 * Uses generic placeholders with zero sensitive or personal identifying information.
 */
export const DEFAULT_CUSTOMER: CustomerData = {
  name: "AZIENDA COMMITTENTE ESEMPIO S.R.L.",
  vat: "12345678901",
  fiscalCode: "12345678901",
  country: "IT",
  cap: "00100",
  city: "ROMA",
  province: "RM",
  address: "VIA ESEMPIO N 1",
};

/**
 * Default generic foreign supplier data with zero sensitive or personal identifying information.
 */
export const DEFAULT_SUPPLIER: SupplierData = {
  name: "FORNITORE ESTERO ESEMPIO S.A.",
  vat: "SK9999999999",
  country: "SK",
  cap: "83104",
  city: "Bratislava",
  address: "VIA ESEMPIO N 10",
};

/**
 * Default invoice data.
 */
export const DEFAULT_INVOICE: InvoiceData = {
  documentType: "TD17",
  invoiceNumber: "INV-2026-001",
  invoiceDate: "2026-07-08",
  amount: "600.00",
  currency: "EUR",
  description: "Servizi di consulenza tecnica o fornitura software",
  vatRate: "0.00",
  vatNature: "N6.1",
  normativeReference: "Inversione contabile",
};

