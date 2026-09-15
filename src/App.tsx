import React, { useState, useEffect } from "react";
import {
  SupplierData,
  CustomerData,
  InvoiceData,
  DocumentType,
  Language,
  Theme,
  EMPTY_CUSTOMER,
  EMPTY_SUPPLIER,
  EMPTY_INVOICE,
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

  // Customer (Cessionario/Committente) state: load saved buyer from localStorage or start empty
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
    return { ...EMPTY_CUSTOMER };
  });

  // Supplier state: starts clean
  const [supplier, setSupplier] = useState<SupplierData>({ ...EMPTY_SUPPLIER });

  // Invoice state: starts clean
  const [invoice, setInvoice] = useState<InvoiceData>({ ...EMPTY_INVOICE });

  // Document extraction status & metadata
  const [hasExtractedFile, setHasExtractedFile] = useState<boolean>(false);
  const [hasExtractedCustomer, setHasExtractedCustomer] = useState<boolean>(false);
  const [extractedMeta, setExtractedMeta] = useState<ExtractionMetaMap | undefined>(undefined);

  // Track fields that have been manually typed/edited or loaded from saved buyer by the user
  const [userEditedFields, setUserEditedFields] = useState<Set<string>>(() => {
    if (typeof window !== "undefined" && localStorage.getItem("profis_buyer_customer")) {
      return new Set([
        "customerName",
        "customerVat",
        "customerCountry",
        "customerCap",
        "customerCity",
        "customerAddress",
        "customerFiscalCode",
        "customerProvince",
      ]);
    }
    return new Set();
  });

  // Real-time validation computation with negative-only highlighting
  const validation = validateAllFields(
    supplier,
    customer,
    invoice,
    hasExtractedFile,
    extractedMeta,
    language,
    userEditedFields
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

  // Heartbeat & auto-shutdown on page close for local standalone executable
  useEffect(() => {
    const pingHeartbeat = () => {
      fetch("/api/heartbeat", { method: "POST" }).catch(() => {});
    };

    pingHeartbeat();
    const interval = setInterval(pingHeartbeat, 5000);

    const handlePageHide = () => {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/shutdown");
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => {
      clearInterval(interval);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

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

  // Form field handlers: when user modifies a field, mark it as user-provided
  const handleCustomerChange = (field: keyof CustomerData, val: string) => {
    setCustomer((prev) => ({ ...prev, [field]: val }));
    const mappedKey = `customer${field.charAt(0).toUpperCase() + field.slice(1)}`;
    setUserEditedFields((prev) => {
      const next = new Set(prev);
      next.add(mappedKey);
      next.add(field);
      return next;
    });
    setFormError(null);
  };

  const handleSupplierChange = (field: keyof SupplierData, val: string) => {
    setSupplier((prev) => ({ ...prev, [field]: val }));
    const mappedKey = `supplier${field.charAt(0).toUpperCase() + field.slice(1)}`;
    setUserEditedFields((prev) => {
      const next = new Set(prev);
      next.add(mappedKey);
      next.add(field);
      return next;
    });
    setFormError(null);
  };

  const handleInvoiceChange = (field: keyof InvoiceData, val: string) => {
    setInvoice((prev) => ({ ...prev, [field]: val }));
    const invoiceKeyMap: Record<string, string> = {
      invoiceNumber: "invoiceNumber",
      invoiceDate: "invoiceDate",
      amount: "invoiceAmount",
      description: "invoiceDescription",
    };
    const mappedKey = invoiceKeyMap[field] || field;
    setUserEditedFields((prev) => {
      const next = new Set(prev);
      next.add(mappedKey);
      next.add(field);
      return next;
    });
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
    setUserEditedFields(new Set()); // Reset user edits for newly extracted invoice

    // Auto-fill supplier fields
    setSupplier({
      name: extracted.supplierName || "",
      vat: extracted.supplierVat || "",
      country: extracted.supplierCountry || "",
      cap: extracted.supplierCap || "",
      city: extracted.supplierCity || "",
      address: extracted.supplierAddress || "",
    });

    // Auto-fill customer fields
    const hasAnyCustomerField = Boolean(
      extracted.customerName ||
      extracted.customerVat ||
      extracted.customerFiscalCode ||
      extracted.customerCountry ||
      extracted.customerCap ||
      extracted.customerCity ||
      extracted.customerProvince ||
      extracted.customerAddress
    );

    if (hasAnyCustomerField) {
      setHasExtractedCustomer(true);
      setCustomer({
        name: extracted.customerName || "",
        vat: extracted.customerVat || "",
        fiscalCode: extracted.customerFiscalCode || "",
        country: extracted.customerCountry || (extracted.customerName ? "IT" : ""),
        cap: extracted.customerCap || "",
        city: extracted.customerCity || "",
        province: extracted.customerProvince || "",
        address: extracted.customerAddress || "",
      });
    } else {
      setHasExtractedCustomer(false);
      // Check if user has a configured saved buyer profile
      let savedBuyer: CustomerData | null = null;
      try {
        const saved = localStorage.getItem("profis_buyer_customer");
        if (saved) savedBuyer = JSON.parse(saved);
      } catch {
        // ignore
      }

      if (savedBuyer && savedBuyer.name) {
        setCustomer(savedBuyer);
        const buyerKeys = [
          "customerName",
          "customerVat",
          "customerCountry",
          "customerCap",
          "customerCity",
          "customerAddress",
          "customerFiscalCode",
          "customerProvince",
        ];
        setUserEditedFields(new Set(buyerKeys));
      } else {
        // Clear customer so unread fields are empty and highlighted in red
        setCustomer({ ...EMPTY_CUSTOMER });
      }
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
    setHasExtractedCustomer(false);
    setExtractedMeta(undefined);
    setUserEditedFields(new Set());
    setCurrentFileName("");
    setSupplier({ ...DEFAULT_SUPPLIER });
    setCustomer({ ...DEFAULT_CUSTOMER });
    setInvoice({ ...DEFAULT_INVOICE });
    setGeneratedXml(null);
    setFormError(null);
  };

  // Reset customer specifically to saved buyer profile from localStorage
  const handleResetCustomerToSaved = () => {
    try {
      const saved = localStorage.getItem("profis_buyer_customer");
      if (saved) {
        setCustomer(JSON.parse(saved));
      } else {
        setCustomer({ ...DEFAULT_CUSTOMER });
      }
    } catch {
      setCustomer({ ...DEFAULT_CUSTOMER });
    }
    const buyerKeys = [
      "customerName",
      "customerVat",
      "customerCountry",
      "customerCap",
      "customerCity",
      "customerAddress",
      "customerFiscalCode",
      "customerProvince",
    ];
    setUserEditedFields((prev) => {
      const next = new Set(prev);
      buyerKeys.forEach((k) => next.add(k));
      return next;
    });
    setHasExtractedCustomer(false);
  };

  // Clear all form inputs
  const handleClear = () => {
    setHasExtractedFile(false);
    setHasExtractedCustomer(false);
    setExtractedMeta(undefined);
    setUserEditedFields(new Set());
    setCurrentFileName("");
    setSupplier({ ...EMPTY_SUPPLIER });
    setCustomer({ ...EMPTY_CUSTOMER });
    setInvoice({ ...EMPTY_INVOICE });
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
      const details =
        validation.invalidFieldLabels && validation.invalidFieldLabels.length > 0
          ? `${t.errRequiredFields}: ${validation.invalidFieldLabels.join(", ")}`
          : t.errRequiredFields;
      setFormError(details);
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
            onResetCustomer={handleResetCustomerToSaved}
            hasExtractedCustomer={hasExtractedCustomer}
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
