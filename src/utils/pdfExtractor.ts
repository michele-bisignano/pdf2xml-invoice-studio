// Ensure Promise.withResolvers polyfill is present before pdfjs-dist usage
if (typeof (Promise as any).withResolvers === "undefined") {
  (Promise as any).withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

import * as pdfjsLib from "pdfjs-dist";
import { createWorker } from "tesseract.js";
import { ExtractedPdfData } from "../types";

// Configure PDF.js worker to point to the statically hosted worker in /public
if (typeof window !== "undefined") {
  try {
    const origin = window.location.origin || "";
    pdfjsLib.GlobalWorkerOptions.workerSrc = origin ? `${origin}/pdf.worker.min.mjs` : "/pdf.worker.min.mjs";
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
}

export type ProgressCallback = (status: string, percent: number) => void;

/**
 * EU member states (ISO 3166-1 alpha-2, excluding Italy which is domestic)
 */
const EU_COUNTRIES = [
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI",
  "FR", "GR", "EL", "HR", "HU", "IE", "LT", "LU", "LV", "MT",
  "NL", "PL", "PT", "RO", "SE", "SI", "SK"
];

/**
 * Detects document type (TD17, TD18, TD16) based on supplier, customer, text, and keywords:
 * - TD16: Domestic Reverse Charge (Italy)
 * - TD18: Intra-EU Goods Purchase (EU supplier with goods/merchandise)
 * - TD17: Foreign Services Purchase (Default for foreign EU/non-EU suppliers)
 */
export function detectDocumentType(
  supplierCountry?: string,
  supplierVat?: string,
  text: string = "",
  description: string = ""
): "TD17" | "TD18" | "TD16" {
  const suppCountry = (supplierCountry || "").toUpperCase().trim();
  const suppVatClean = (supplierVat || "").toUpperCase().replace(/[\s.-]/g, "");
  const fullContent = `${text} ${description}`.toLowerCase();

  // 1. TD16: Italian Domestic Reverse Charge
  const isItalianSupplier =
    suppCountry === "IT" ||
    suppVatClean.startsWith("IT") ||
    (/^\d{11}$/.test(suppVatClean) && suppCountry === "");

  if (isItalianSupplier) {
    return "TD16";
  }

  // 2. TD18: Intra-EU Goods Purchase
  const isEuSupplier = EU_COUNTRIES.includes(suppCountry);

  // Keywords that distinguish physical goods vs services
  const goodsKeywords = /\b(beni|merce|merci|prodotti|prodotto|materiale|materiali|hardware|ricambi|equipment|attrezzature|colli|collo|imballo|imballaggi|peso|weight|kg|pcs|pezzi|pieces|quantit[àa]|quantity|unit price|prezzo unitario|cmr|ddt|shipping of goods|delivery note|bolla di consegna)\b/i;
  const servicesKeywords = /\b(servizi|servizio|services|service|consulenza|consulting|subscription|abbonamento|licenza|license|licenses|software|saas|cloud|hosting|domain|canone|maintenance|manutenzione|support|assistenza|sviluppo|advertising|ads)\b/i;

  if (isEuSupplier) {
    // If text contains goods indicators and is not purely a digital service/software
    if (goodsKeywords.test(fullContent) && !servicesKeywords.test(fullContent)) {
      return "TD18";
    }
    if (goodsKeywords.test(fullContent)) {
      return "TD18";
    }
  }

  // 3. TD17: Foreign Services Purchase (Default for foreign purchases)
  return "TD17";
}

/**
 * Normalizes date string into YYYY-MM-DD or preserves candidate.
 */
function normalizeDate(rawDateStr: string): string | undefined {
  const clean = rawDateStr.trim().replace(/[,\s]+/g, " ");

  // Pattern 1: YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const isoMatch = clean.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, "0");
    const day = isoMatch[3].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Pattern 2: DD/MM/YYYY or DD.MM.YYYY or DD-MM-YYYY
  const euMatch = clean.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (euMatch) {
    const day = euMatch[1].padStart(2, "0");
    const month = euMatch[2].padStart(2, "0");
    const year = euMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Pattern 3: Textual month (e.g. 08 Luglio 2026, 8 July 2026, 15 Set 2026)
  const monthNames: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
    gen: "01", mag: "05", giu: "06", lug: "07", ago: "08", set: "09", ott: "10", dic: "12",
    febbraio: "02", marzo: "03", aprile: "04", maggio: "05", giugno: "06",
    luglio: "07", agosto: "08", settembre: "09", ottobre: "10", novembre: "11", dicembre: "12",
    january: "01", february: "02", march: "03", april: "04", june: "06",
    july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
  };
  const textualMatch = clean.match(/(\d{1,2})\s+([a-zA-Z]{3,12})\s+(\d{4})/i);
  if (textualMatch) {
    const day = textualMatch[1].padStart(2, "0");
    const monthKey = textualMatch[2].toLowerCase();
    const month = monthNames[monthKey] || monthNames[monthKey.slice(0, 3)] || "01";
    const year = textualMatch[3];
    return `${year}-${month}-${day}`;
  }

  // If partially recognizable (e.g. "2026-07"), return raw trimmed string so user sees it in field
  if (/\d{2,4}/.test(clean)) {
    return clean;
  }

  return undefined;
}

/**
 * Normalizes financial amount string to decimal format (e.g. 600.00).
 */
function normalizeAmount(rawAmountStr: string): string | undefined {
  let clean = rawAmountStr.replace(/[^\d.,]/g, "").trim();
  if (!clean) return rawAmountStr.trim() || undefined;

  // Handle European format 1.250,50 -> 1250.50
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
  if (isNaN(num)) return rawAmountStr.trim();
  return num.toFixed(2);
}

/**
 * Parses raw text extracted from PDF or OCR and derives invoice, supplier, and customer fields.
 */
export function parseInvoiceFieldsFromText(text: string): ExtractedPdfData {
  const result: ExtractedPdfData = {
    rawTextPreview: text.slice(0, 1500),
  };

  if (!text || text.trim().length === 0) {
    return result;
  }

  // -------------------------------------------------------------
  // 1. Identify Customer (Buyer) Section vs Supplier Section
  // -------------------------------------------------------------
  const customerSectionRegex = /(?:(?:Bill|Invoice|Sold|Ship|Deliver|Billed|Invoiced)\s*(?:to)?|Customer(?:\s*Details)?|Client[e]?|Buyer|Purchaser|Spett\.?(?:le|abile)?|Destinatario|Fatturato\s*a|Intestato\s*a|Cessionario\s*(?:\/?\s*Committente)?|Committente|Dati\s*del\s*Committente)[^\w\n]{0,8}\n?((?:[^\n]+\n?){1,10})/i;
  const customerMatch = text.match(customerSectionRegex);
  const customerBlock = customerMatch ? customerMatch[1] : "";

  // -------------------------------------------------------------
  // 2. VAT Numbers Extraction (Supplier and Customer)
  // -------------------------------------------------------------
  // Find all VAT-like patterns in document
  const allVatMatches = Array.from(
    text.matchAll(/(?:VAT(?:\s*No|\s*Number|\s*ID)?|P\.?\s*IVA|Partita\s*IVA|USt[-–]?IdNr|UID|NIF|TVA|IČ\s*DPH|DIČ|Tax\s*ID|Cod\.?\s*Fisc)[^\w\n]{0,6}([A-Z]{2})?[\s.-]*([0-9A-Z]{6,16})/gi)
  );

  let supplierVatCandidate = "";
  let supplierCountryCandidate = "";
  let customerVatCandidate = "";
  let customerCountryCandidate = "IT";

  // Check customer block first for customer VAT
  if (customerBlock) {
    const custVatInBlock = customerBlock.match(/(?:VAT|P\.?\s*IVA|Partita\s*IVA|Tax\s*ID)[^\w\n]{0,6}(?:(IT))?[\s.-]*([0-9]{11})\b/i);
    if (custVatInBlock) {
      customerVatCandidate = custVatInBlock[2];
      customerCountryCandidate = "IT";
    } else {
      // General 11 digits in customer block (standard Italian P.IVA)
      const elevenDigits = customerBlock.match(/\b(?:IT)?([0-9]{11})\b/i);
      if (elevenDigits) {
        customerVatCandidate = elevenDigits[1];
        customerCountryCandidate = "IT";
      }
    }

    // Italian Codice Fiscale: 16 alphanumeric characters (for individuals) OR 11 digits (for companies)
    const cf16Match = customerBlock.match(/\b([A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z])\b/i);
    const cf11Match = customerBlock.match(/(?:Cod\.?\s*Fisc(?:ale)?|C\.?\s*F\.?)[^\w\n]{0,6}([0-9]{11})\b/i);
    if (cf16Match) {
      result.customerFiscalCode = cf16Match[1].toUpperCase();
    } else if (cf11Match) {
      result.customerFiscalCode = cf11Match[1];
    }
  }

  // If customer Fiscal Code not found yet, check full text for labeled CF
  if (!result.customerFiscalCode) {
    const cfLabeled16 = text.match(/(?:Cod\.?\s*Fisc(?:ale)?|C\.?\s*F\.?)[^\w\n]{0,6}([A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z])\b/i);
    const cfLabeled11 = text.match(/(?:Cod\.?\s*Fisc(?:ale)?|C\.?\s*F\.?)[^\w\n]{0,6}([0-9]{11})\b/i);
    if (cfLabeled16) {
      result.customerFiscalCode = cfLabeled16[1].toUpperCase();
    } else if (cfLabeled11) {
      result.customerFiscalCode = cfLabeled11[1];
    }
  }

  // If customer VAT not found in block, search if there is an Italian VAT (11 digits) distinct from supplier VAT
  if (!customerVatCandidate) {
    const itVatMatch = text.match(/\b(?:IT)?([0-9]{11})\b/);
    if (itVatMatch) {
      customerVatCandidate = itVatMatch[1];
      customerCountryCandidate = "IT";
    }
  }

  // Supplier VAT
  for (const m of allVatMatches) {
    const country = (m[1] || "").toUpperCase();
    const cleanCode = m[2].replace(/[\s.-]/g, "").toUpperCase();
    const fullCode = country ? `${country}${cleanCode}` : cleanCode;

    // Skip if it's the customer VAT
    if (customerVatCandidate && fullCode.includes(customerVatCandidate)) {
      continue;
    }

    supplierCountryCandidate = country || (cleanCode.length >= 8 && /^[A-Z]{2}/.test(cleanCode) ? cleanCode.slice(0, 2) : "");
    supplierVatCandidate = fullCode;
    break;
  }

  // Fallback search general EU VAT pattern for supplier
  if (!supplierVatCandidate) {
    const vatRegex = /\b([A-Z]{2})\s*([0-9A-Z]{6,14})\b/g;
    const matches = Array.from(text.matchAll(vatRegex));
    for (const match of matches) {
      const country = match[1].toUpperCase();
      const code = match[2].toUpperCase();
      if (!["IB", "EU", "NO", "OK", "ID", "TX", "N.", "TO", "DO"].includes(country)) {
        if (!customerVatCandidate || code !== customerVatCandidate) {
          supplierCountryCandidate = country;
          supplierVatCandidate = `${country}${code}`;
          break;
        }
      }
    }
  }

  if (supplierVatCandidate) {
    result.supplierVat = supplierVatCandidate;
    result.supplierCountry = supplierCountryCandidate || supplierVatCandidate.slice(0, 2);
  }
  if (customerVatCandidate) {
    result.customerVat = customerVatCandidate;
    result.customerCountry = customerCountryCandidate;
  }

  // -------------------------------------------------------------
  // 3. Customer Name & Address Extraction
  // -------------------------------------------------------------
  if (customerBlock) {
    const lines = customerBlock
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 2);

    for (const line of lines) {
      // Find customer company name (first line not matching label or vat)
      if (
        !result.customerName &&
        !/(bill\s*to|invoice\s*to|sold\s*to|spett|destinatario|p\.?\s*iva|vat|tax\s*id|c\.?f\.?|tel|email|buyer|client|customer)/i.test(line) &&
        line.length >= 3 &&
        line.length <= 80
      ) {
        result.customerName = line;
      }

      // Italian CAP (5 digits) in customer block
      if (!result.customerCap) {
        const custCapMatch = line.match(/\b(\d{5})\b/);
        if (custCapMatch) {
          result.customerCap = custCapMatch[1];
        }
      }

      // Customer City & optional Province (e.g. 00100 Roma (RM))
      if (!result.customerCity) {
        const cityMatch = line.match(/\b\d{5}\s+([A-Za-zÀ-ÖØ-öø-ÿ\s-]{2,30})(?:\s*\(([A-Za-z]{2})\))?/);
        if (cityMatch) {
          result.customerCity = cityMatch[1].trim();
          if (cityMatch[2] && !result.customerProvince) {
            result.customerProvince = cityMatch[2].toUpperCase();
          }
        }
      }

      // Customer Province standalone
      if (!result.customerProvince) {
        const provMatch = line.match(/(?:\(([A-Za-z]{2})\)|\b(?:Prov\.?|Provincia)\s*([A-Za-z]{2})\b)/i);
        if (provMatch) {
          result.customerProvince = (provMatch[1] || provMatch[2]).toUpperCase();
        }
      }

      // Customer Address
      if (!result.customerAddress) {
        const addrMatch = line.match(/(?:via|viale|corso|piazza|strada|loc\.?|localit[àa]|largo|vicolo|stradone|contrada|address|indirizzo|street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?|drive|dr\.?|lane|way|rue|calle)\s+[A-Za-z0-9\s.,'°/-]+/i);
        if (addrMatch) {
          result.customerAddress = addrMatch[0].trim();
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 4. Supplier Name & Address Extraction
  // -------------------------------------------------------------
  const fromMatch = text.match(/(?:From|Supplier|Fornitore|Cedente|Emesso\s*da|Seller|Societ[àa]|Company)[^\w\n]{0,5}\n?([A-Za-z0-9.,&'’\s-]{3,60})/i);
  if (fromMatch && fromMatch[1].trim().length > 3) {
    result.supplierName = fromMatch[1].trim().split("\n")[0];
  } else {
    // In many invoices and scans, supplier company name is in the first lines
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 2);
    for (const line of lines.slice(0, 8)) {
      if (
        !/(invoice|fattura|rechnung|date|data|page|pagina|original|duplicate|tax|vat|p\.iva|bill\s*to|sold\s*to|receipt|total)/i.test(line) &&
        line.length >= 3 &&
        line.length <= 60
      ) {
        result.supplierName = line;
        break;
      }
    }
  }

  // Supplier Address: Check labeled address first
  const suppAddrMatch = text.match(/(?:Address|Indirizzo|Sede\s*(?:Legale|Operativa)?|Adresse|Registered\s*Office)[^\w\n]{0,5}[:\s]*\n?([A-Za-z0-9\s.,'°/-]{5,60})/i);
  if (suppAddrMatch) {
    const rawAddr = suppAddrMatch[1].trim().split("\n")[0];
    if (!rawAddr.toLowerCase().includes(result.customerAddress?.toLowerCase() || "_____")) {
      result.supplierAddress = rawAddr;
    }
  }

  // Fallback: look for typical street patterns in text (excluding customer address)
  if (!result.supplierAddress) {
    const allStreetMatches = Array.from(
      text.matchAll(/(?:via|viale|corso|piazza|strada|loc\.?|localit[àa]|largo|vicolo|stradone|contrada|street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?|drive|dr\.?|lane|ln\.?|way|platz|strasse|straße|str\.?|rue|calle|cours|allee|allée|chemin)\s+[A-Za-z0-9\s.,'°/-]{4,45}/gi)
    );
    for (const sm of allStreetMatches) {
      const candidate = sm[0].trim().split("\n")[0];
      if (!result.customerAddress || !candidate.toLowerCase().includes(result.customerAddress.toLowerCase())) {
        result.supplierAddress = candidate;
        break;
      }
    }
  }

  // Supplier CAP & City
  const cityLabelMatch = text.match(/(?:City|Comune|Citt[àa]|Ort|Ville)[^\w\n]{0,5}[:\s]*([A-Za-z\s-]{3,30})/i);
  if (cityLabelMatch) {
    result.supplierCity = cityLabelMatch[1].trim();
  }

  // Look for Postal code + City pattern (e.g., 83104 Bratislava or 10115 Berlin or 75001 Paris)
  const capCityMatch = text.match(/\b(\d{4,5})\s+([A-Za-zÀ-ÖØ-öø-ÿ\s-]{2,30})\b/);
  if (capCityMatch) {
    const capFound = capCityMatch[1];
    const cityFound = capCityMatch[2].trim().split("\n")[0];
    if (capFound !== result.customerCap) {
      if (!result.supplierCap) result.supplierCap = capFound;
      if (!result.supplierCity) result.supplierCity = cityFound;
    }
  }

  // Standalone supplier CAP if not yet found
  if (!result.supplierCap) {
    const capMatch = text.match(/\b(\d{4,5})\b/);
    if (capMatch && capMatch[1] !== result.customerCap) {
      result.supplierCap = capMatch[1];
    }
  }

  // -------------------------------------------------------------
  // 5. Invoice Date
  // -------------------------------------------------------------
  const dateLabelRegex = /(?:Invoice\s*Date|Date\s*of\s*issue|Fattura\s*del|Data\s*fattura|Data\s*emissione|Data\s*documento|Rechnungsdatum|Date\s*d['’]émission|Datum\s*vystavenia|Date\s*d['’]achat|Purchase\s*Date|Order\s*Date|Date)[^\d\n]{0,8}[:\s]*(\d{1,4}[-/.][A-Za-z0-9]{1,12}[-/.]\d{2,4}|\d{1,2}\s+[A-Za-z]{3,12}\s+\d{4})/i;
  const dateMatch = text.match(dateLabelRegex);
  if (dateMatch) {
    const parsed = normalizeDate(dateMatch[1]);
    if (parsed) result.invoiceDate = parsed;
  }

  if (!result.invoiceDate) {
    const generalDateMatch = text.match(/\b(\d{4}[-/.]\d{2}[-/.]\d{2}|\d{2}[-/.]\d{2}[-/.]\d{4})\b/);
    if (generalDateMatch) {
      const parsed = normalizeDate(generalDateMatch[1]);
      if (parsed) result.invoiceDate = parsed;
    }
  }

  // -------------------------------------------------------------
  // 6. Invoice Number
  // -------------------------------------------------------------
  const invNumLabelRegex = /(?:Invoice\s*(?:Number|No\.?|#|Num\.?|ID)?|Inv\s*(?:#|No\.?|Num\.?)|Fattura\s*(?:N(?:umero|\.|°)?)|Fatt\.?\s*(?:N(?:umero|\.|°)?)|Rechnung\s*(?:Nr\.?)|Facture\s*(?:N(?:umero|\.|°)?)|Fakt[uú]ra\s*(?:č\.?)|Doc(?:ument)?\s*(?:No|#)|Documento\s*N\.?)[^\w\n]{0,6}[:\s]*([A-Za-z0-9\-_/]{2,28})/i;
  const invNumMatch = text.match(invNumLabelRegex);
  if (invNumMatch) {
    const rawNum = invNumMatch[1].trim();
    if (!["date", "data", "total", "totale", "amount", "euro", "eur", "page", "tax", "vat"].includes(rawNum.toLowerCase())) {
      result.invoiceNumber = rawNum;
    }
  }

  // -------------------------------------------------------------
  // 7. Invoice Amount
  // -------------------------------------------------------------
  const amountLabelRegex = /(?:Total\s*(?:Due|Amount|Gross|Payable)?|Totale\s*(?:Fattura|Documento|Lordo|da\s*pagare|Imponibile|a\s*pagare)?|Amount\s*Due|Total\s*to\s*pay|Balance\s*Due|Net\s*Amount|Subtotal|Gesamtbetrag|Montant\s*Total|Celkov[aá]\s*suma|Grand\s*Total|Taxable\s*Amount|Imponibile)[^\d\n]{0,8}[:\s]*(?:EUR|€|\$|GBP|USD)?\s*([\d.,]{2,12})\s*(?:EUR|€|\$|GBP|USD)?/i;
  const amountMatch = text.match(amountLabelRegex);
  if (amountMatch) {
    const parsedAmount = normalizeAmount(amountMatch[1]);
    if (parsedAmount) result.invoiceAmount = parsedAmount;
  }

  if (!result.invoiceAmount) {
    const fallbackAmount = text.match(/\b([\d.,]{2,10})\s*(?:EUR|€)\b/i);
    if (fallbackAmount) {
      const parsedAmount = normalizeAmount(fallbackAmount[1]);
      if (parsedAmount) result.invoiceAmount = parsedAmount;
    }
  }

  // -------------------------------------------------------------
  // 8. Description / Causale
  // -------------------------------------------------------------
  const descMatch = text.match(
    /(?:Description|Descrizione|Oggetto|Subject|Causale|Item|Gegenstand|Services?\s*rendered)[^\w\n]{0,5}([A-Za-z0-9\s.,'()\-]{5,100})/i
  );
  if (descMatch) {
    result.invoiceDescription = descMatch[1].trim().split("\n")[0];
  }

  // -------------------------------------------------------------
  // 9. Automatic Document Type Detection (TD17 / TD18 / TD16)
  // -------------------------------------------------------------
  const detectedDoc = detectDocumentType(
    result.supplierCountry,
    result.supplierVat,
    text,
    result.invoiceDescription
  );
  result.documentType = detectedDoc;
  result.detectedDocumentType = detectedDoc;

  // -------------------------------------------------------------
  // 10. Populate extraction metadata
  // -------------------------------------------------------------
  result.extractedFields = {
    supplierName: { wasExtracted: !!result.supplierName, rawExtractedValue: result.supplierName },
    supplierVat: { wasExtracted: !!result.supplierVat, rawExtractedValue: result.supplierVat },
    supplierCountry: { wasExtracted: !!result.supplierCountry, rawExtractedValue: result.supplierCountry },
    supplierCap: { wasExtracted: !!result.supplierCap, rawExtractedValue: result.supplierCap },
    supplierCity: { wasExtracted: !!result.supplierCity, rawExtractedValue: result.supplierCity },
    supplierAddress: { wasExtracted: !!result.supplierAddress, rawExtractedValue: result.supplierAddress },
    customerName: { wasExtracted: !!result.customerName, rawExtractedValue: result.customerName },
    customerVat: { wasExtracted: !!result.customerVat, rawExtractedValue: result.customerVat },
    customerFiscalCode: { wasExtracted: !!result.customerFiscalCode, rawExtractedValue: result.customerFiscalCode },
    customerCountry: { wasExtracted: !!result.customerCountry, rawExtractedValue: result.customerCountry },
    customerCap: { wasExtracted: !!result.customerCap, rawExtractedValue: result.customerCap },
    customerCity: { wasExtracted: !!result.customerCity, rawExtractedValue: result.customerCity },
    customerProvince: { wasExtracted: !!result.customerProvince, rawExtractedValue: result.customerProvince },
    customerAddress: { wasExtracted: !!result.customerAddress, rawExtractedValue: result.customerAddress },
    invoiceNumber: { wasExtracted: !!result.invoiceNumber, rawExtractedValue: result.invoiceNumber },
    invoiceDate: { wasExtracted: !!result.invoiceDate, rawExtractedValue: result.invoiceDate },
    invoiceAmount: { wasExtracted: !!result.invoiceAmount, rawExtractedValue: result.invoiceAmount },
    invoiceDescription: { wasExtracted: !!result.invoiceDescription, rawExtractedValue: result.invoiceDescription },
  };

  return result;
}

/**
 * Extracts raw textual lines from a digital PDF File preserving line breaks based on coordinates.
 */
async function extractDigitalTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });
  const pdfDocument = await loadingTask.promise;

  let fullText = "";
  const numPages = pdfDocument.numPages;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    let pageLines = "";
    let lastY: number | null = null;

    for (const item of textContent.items) {
      if (!("str" in item)) continue;
      const textItem = item as { str: string; transform?: number[]; hasEOL?: boolean };
      const currentY = textItem.transform ? textItem.transform[5] : null;

      if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 3) {
        pageLines += "\n";
      } else if (textItem.hasEOL) {
        pageLines += "\n";
      } else if (pageLines.length > 0 && !pageLines.endsWith("\n") && !pageLines.endsWith(" ")) {
        pageLines += " ";
      }
      pageLines += textItem.str;
      lastY = currentY;
    }
    fullText += pageLines + "\n\n";
  }

  return fullText;
}

/**
 * Renders a PDF page to a high-resolution canvas for optimal OCR accuracy.
 * Scale 2.0 provides ~150-200 DPI which is ideal for Tesseract.js.
 */
async function renderPageToCanvas(page: pdfjsLib.PDFPageProxy, scale: number = 2.0): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas 2D context creation failed");

  // Ensure solid crisp white background behind any transparent scan layer
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: context,
    canvas: canvas,
    viewport: viewport,
  }).promise;

  return canvas;
}

/**
 * Runs local Tesseract.js OCR on an image or canvas client-side.
 * Uses Italian and English models with offline IndexedDB caching.
 */
async function runLocalOcr(
  imageSource: HTMLCanvasElement | File | Blob,
  onProgress?: ProgressCallback,
  pageLabel: string = ""
): Promise<{ text: string; confidence: number }> {
  // Safety timeout of 35 seconds for OCR recognition
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Timeout elaborazione OCR (tempo massimo superato).")), 35000);
  });

  const ocrPromise = (async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    let worker: any = null;
    try {
      worker = await createWorker(["ita", "eng"], 1, {
        workerPath: origin ? `${origin}/tesseract-worker.min.js` : "/tesseract-worker.min.js",
        langPath: origin ? `${origin}/tessdata` : "/tessdata",
        corePath: origin ? `${origin}/tesseract-core` : "/tesseract-core",
        workerBlobURL: false,
        gzip: false,
        cacheMethod: "none",
        errorHandler: (err: any) => {
          console.warn("Tesseract worker handled error:", err);
        },
        logger: (m: any) => {
          if (m && onProgress) {
            const pct = typeof m.progress === "number" ? Math.round(m.progress * 100) : 0;
            let msg = "Riconoscimento caratteri in corso...";
            if (m.status === "loading tesseract core") {
              msg = "Inizializzazione motore OCR locale...";
            } else if (m.status === "loading language traineddata") {
              msg = "Caricamento dizionario lingua OCR (ITA/ENG)...";
            } else if (m.status === "recognizing text") {
              msg = pageLabel ? `${pageLabel}: ${pct}%` : `Riconoscimento OCR: ${pct}%`;
            }
            onProgress(msg, pct);
          }
        },
      });

      const response = await worker.recognize(imageSource);
      clearTimeout(timeoutId);
      return {
        text: response?.data?.text || "",
        confidence: response?.data?.confidence || 0,
      };
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch (termErr) {
          console.warn("Worker termination error:", termErr);
        }
      }
    }
  })();

  return Promise.race([ocrPromise, timeoutPromise]);
}

/**
 * Main unified entry point: handles native digital PDFs, scanned PDFs (via OCR),
 * and direct scanned image files (PNG, JPG, JPEG, WEBP).
 */
export async function extractInvoiceDataFromFile(
  file: File,
  onProgress?: ProgressCallback
): Promise<ExtractedPdfData> {
  const fileName = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || fileName.endsWith(".pdf");
  const isImage =
    file.type.startsWith("image/") ||
    fileName.endsWith(".png") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".webp") ||
    fileName.endsWith(".bmp") ||
    fileName.endsWith(".tiff");

  if (!isPdf && !isImage) {
    throw new Error("Formato non supportato. Carica un file PDF o un'immagine (PNG, JPG, JPEG).");
  }

  // 1. Case A: PDF file
  if (isPdf) {
    onProgress?.("Verifica testo digitale...", 10);
    let digitalText = "";
    try {
      digitalText = await extractDigitalTextFromPdf(file);
    } catch (err) {
      console.warn("Digital text extraction failed, falling back to OCR:", err);
    }

    // Check if digital text has meaningful content (at least 40 chars with letters & numbers)
    const hasMeaningfulDigitalText =
      digitalText &&
      digitalText.trim().length >= 40 &&
      /[a-zA-Z]{3,}/.test(digitalText) &&
      /\d{2,}/.test(digitalText);

    if (hasMeaningfulDigitalText) {
      onProgress?.("Completamento estrazione digitale...", 100);
      const parsed = parseInvoiceFieldsFromText(digitalText);
      parsed.extractionMethod = "digital";
      return parsed;
    }

    // Digital text was missing or too sparse -> It is a SCANNED PDF!
    onProgress?.("Scansione rilevata: rendering pagina ad alta risoluzione...", 15);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDocument = await loadingTask.promise;
      const numPages = pdfDocument.numPages;

      // Render Page 1 (where 95% of invoice headers, VAT, supplier info are located)
      const page1 = await pdfDocument.getPage(1);
      const canvas1 = await renderPageToCanvas(page1, 2.0);

      onProgress?.("Avvio OCR locale su pagina 1...", 25);
      const ocrResult1 = await runLocalOcr(canvas1, onProgress, "Lettura OCR Pagina 1");
      let combinedText = ocrResult1.text;
      let avgConfidence = ocrResult1.confidence;

      // If there's a Page 2 and Page 1 was short or had missing total, also scan Page 2
      if (numPages > 1) {
        try {
          onProgress?.("Lettura OCR Pagina 2...", 75);
          const page2 = await pdfDocument.getPage(2);
          const canvas2 = await renderPageToCanvas(page2, 2.0);
          const ocrResult2 = await runLocalOcr(canvas2, onProgress, "Lettura OCR Pagina 2");
          combinedText += "\n\n--- PAGINA 2 ---\n" + ocrResult2.text;
          avgConfidence = Math.round((ocrResult1.confidence + ocrResult2.confidence) / 2);
        } catch (page2Err) {
          console.warn("Page 2 OCR skipped:", page2Err);
        }
      }

      onProgress?.("Analisi campi fiscali completata", 100);
      const parsed = parseInvoiceFieldsFromText(combinedText);
      parsed.extractionMethod = "ocr";
      parsed.ocrConfidence = avgConfidence;
      return parsed;
    } catch (ocrErr: any) {
      console.warn("OCR extraction encountered an error:", ocrErr);
      if (digitalText && digitalText.trim().length > 10) {
        const parsed = parseInvoiceFieldsFromText(digitalText);
        parsed.extractionMethod = "digital";
        return parsed;
      }
      throw new Error(ocrErr?.message || "Riconoscimento OCR non riuscito sul documento.");
    }
  }

  // 2. Case B: Direct Image scan (PNG, JPG, etc.)
  onProgress?.("Avvio scansione immagine con OCR locale...", 20);
  const imageOcr = await runLocalOcr(file, onProgress, "Lettura OCR Immagine");

  onProgress?.("Analisi campi fiscali completata", 100);
  const parsed = parseInvoiceFieldsFromText(imageOcr.text);
  parsed.extractionMethod = "ocr";
  parsed.ocrConfidence = imageOcr.confidence;
  return parsed;
}
