import React, { useState, useEffect } from "react";
import {
  SupplierData,
  CustomerData,
  InvoiceData,
  DocumentType,
  Language,
  Theme,
  DEFAULT_CUSTOMER,
  DEFAULT_SUPPLIER,
  DEFAULT_INVOICE,
  DOCUMENT_TYPES,
  ExtractedPdfData,
  ExtractionMetaMap,
} from "./types";
import { Header } from "./components/Header";
import { PdfDropzone } from "./components/PdfDropzone";
import { InvoiceForm } from "./components/InvoiceForm";
import { XmlResult } from "./components/XmlResult";
import { BuyerSettingsModal } from "./components/BuyerSettingsModal";
import { generateInvoiceXml, generateFilename } from "./utils/xmlGenerator";
import { translations } from "./utils/i18n";
import { validateAllFields } from "./utils/validation";

export const App: React.FC = () => {
  // Theme state
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("profis_theme");
      if (saved === "dark" || saved === "light") return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  // Language state
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("profis_lang");
      if (saved === "EN" || saved === "IT") return saved;
    }
    return "IT";
  });

  // Uploaded input filename for preserving XML output naming
  const [currentFileName, setCurrentFileName] = useState<string>("");

  // Customer (Cessionario/Committente) state
  const [customer, setCustomer] = useState<CustomerData>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("profis_buyer_customer");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return { ...DEFAULT_CUSTOMER };
  });

  // Supplier state
  const [supplier, setSupplier] = useState<SupplierData>({ ...DEFAULT_SUPPLIER });

  // Invoice state
  const [invoice, setInvoice] = useState<InvoiceData>({ ...DEFAULT_INVOICE });

  // Document extraction status & metadata
  const [hasExtractedFile, setHasExtractedFile] = useState<boolean>(false);
  const [extractedMeta, setExtractedMeta] = useState<ExtractionMetaMap | undefined>(undefined);

  // Real-time validation computation with negative-only highlighting
  const validation = validateAllFields(
    supplier,
    customer,
    invoice,
    hasExtractedFile,
    extractedMeta,
    language
  );

  // UI modal and result states
  const [isBuyerModalOpen, setIsBuyerModalOpen] = useState(false);
  const [generatedXml, setGeneratedXml] = useState<string | null>(null);
  const [generatedFilename, setGeneratedFilename] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const t = translations[language];

  // Sync theme with HTML class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("profis_theme", theme);
  }, [theme]);

  // Sync language with localStorage
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem("profis_lang", newLang);
  };

  // Sync customer defaults with localStorage
  const handleSaveCustomer = (newCustomer: CustomerData) => {
    setCustomer(newCustomer);
    localStorage.setItem("profis_buyer_customer", JSON.stringify(newCustomer));
  };

  // Form field handlers
  const handleCustomerChange = (field: keyof CustomerData, val: string) => {
    setCustomer((prev) => ({ ...prev, [field]: val }));
    setFormError(null);
  };

  const handleSupplierChange = (field: keyof SupplierData, val: string) => {
    setSupplier((prev) => ({ ...prev, [field]: val }));
    setFormError(null);
  };

  const handleInvoiceChange = (field: keyof InvoiceData, val: string) => {
    setInvoice((prev) => ({ ...prev, [field]: val }));
    setFormError(null);
  };

  const handleDocTypeChange = (docType: DocumentType) => {
    const selected = DOCUMENT_TYPES.find((d) => d.code === docType);
    setInvoice((prev) => ({
      ...prev,
      documentType: docType,
      vatNature: selected?.defaultNature ?? prev.vatNature,
    }));
  };

  // Auto-fill from PDF / document extraction
  const handleDataExtracted = (extracted: ExtractedPdfData, fileName: string) => {
    setHasExtractedFile(true);
    setExtractedMeta(extracted.extractedFields);
    setCurrentFileName(fileName);

    // Auto-fill supplier fields
    setSupplier({
      name: extracted.supplierName || "",
      vat: extracted.supplierVat || "",
      country: extracted.supplierCountry || "",
      cap: extracted.supplierCap || "",
      city: extracted.supplierCity || "",
      address: extracted.supplierAddress || "",
    });

    // Auto-fill customer fields if extracted, otherwise retain existing
    if (
      extracted.customerName ||
      extracted.customerVat ||
      extracted.customerFiscalCode ||
      extracted.customerAddress
    ) {
      setCustomer((prev) => ({
        ...prev,
        name: extracted.customerName || prev.name,
        vat: extracted.customerVat || prev.vat,
        fiscalCode: extracted.customerFiscalCode || prev.fiscalCode || "",
        country: extracted.customerCountry || prev.country || "IT",
        cap: extracted.customerCap || prev.cap || "",
        city: extracted.customerCity || prev.city || "",
        address: extracted.customerAddress || prev.address || "",
      }));
    }

    // Auto-detect document type
    const docType: DocumentType = extracted.detectedDocumentType || "TD17";
    const selected = DOCUMENT_TYPES.find((d) => d.code === docType);

    setInvoice((prev) => ({
      ...prev,
      documentType: docType,
      vatNature: selected?.defaultNature ?? prev.vatNature,
      invoiceNumber: extracted.invoiceNumber || "",
      invoiceDate: extracted.invoiceDate || "",
      amount: extracted.invoiceAmount || "",
      description: extracted.invoiceDescription || "",
    }));

    setFormError(null);
  };

  // Reset to original sample data
  const handleLoadSample = () => {
    setHasExtractedFile(false);
    setExtractedMeta(undefined);
    setCurrentFileName("");
    setSupplier({ ...DEFAULT_SUPPLIER });
    setCustomer({ ...DEFAULT_CUSTOMER });
    setInvoice({ ...DEFAULT_INVOICE });
    setFormError(null);
  };

  // Clear all form inputs
  const handleClear = () => {
    setHasExtractedFile(false);
    setExtractedMeta(undefined);
    setCurrentFileName("");
    setSupplier({
      name: "",
      vat: "",
      country: "",
      cap: "",
      city: "",
      address: "",
    });
    setInvoice({
      documentType: "TD17",
      invoiceNumber: "",
      invoiceDate: "",
      amount: "",
      currency: "EUR",
      description: "",
      vatRate: "0.00",
      vatNature: "N6.1",
      normativeReference: "Inversione contabile",
    });
    setGeneratedXml(null);
    setFormError(null);
  };

  // Trigger XML file download in browser
  const triggerDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate and save XML
  const handleGenerateXml = () => {
    if (!validation.isValid) {
      setFormError(t.errRequiredFields);
      return;
    }

    setFormError(null);

    const fullState = { supplier, customer, invoice };
    const xml = generateInvoiceXml(fullState);
    const filename = generateFilename(fullState, currentFileName);

    setGeneratedXml(xml);
    setGeneratedFilename(filename);

    // Automatically trigger immediate browser file download
    triggerDownload(xml, filename);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header with App Logo and Controls */}
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        theme={theme}
        onThemeToggle={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
        onOpenBuyerSettings={() => setIsBuyerModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="space-y-6">
          {/* PDF & Document Drag & Drop */}
          <PdfDropzone
            language={language}
            onDataExtracted={handleDataExtracted}
          />

          {/* Clean Form with Document Type, Customer, Supplier, and Invoice details */}
          <InvoiceForm
            language={language}
            customer={customer}
            onCustomerChange={handleCustomerChange}
            supplier={supplier}
            onSupplierChange={handleSupplierChange}
            invoice={invoice}
            onInvoiceChange={handleInvoiceChange}
            onDocTypeChange={handleDocTypeChange}
            onGenerate={handleGenerateXml}
            onLoadSample={handleLoadSample}
            onClear={handleClear}
            error={formError}
            hasExtractedFile={hasExtractedFile}
            validation={validation}
          />

          {/* Inline Result Section */}
          {generatedXml && (
            <XmlResult
              language={language}
              xmlContent={generatedXml}
              filename={generatedFilename}
              onDownload={() => triggerDownload(generatedXml, generatedFilename)}
            />
          )}

          {/* Footer information */}
          <footer className="pt-6 pb-2 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>{t.footerStandard}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {t.footerOfflineNote}
            </p>
          </footer>
        </div>
      </main>

      {/* Default Customer Settings Modal */}
      <BuyerSettingsModal
        isOpen={isBuyerModalOpen}
        onClose={() => setIsBuyerModalOpen(false)}
        language={language}
        customer={customer}
        onSaveCustomer={handleSaveCustomer}
      />
    </div>
  );
};

export default App;
