import { Language } from "../types";

export interface Translations {
  appTitle: string;
  appSubtitle: string;
  headerBadge: string;
  langIt: string;
  langEn: string;
  themeLight: string;
  themeDark: string;
  buyerSettingsBtn: string;
  buyerSettingsTitle: string;
  buyerSettingsDesc: string;
  saveSettings: string;
  close: string;
  
  // Document type selector
  docTypeLabel: string;
  docTypeHint: string;

  // PDF Dropzone
  pdfDropzoneTitle: string;
  pdfDropzoneSub: string;
  pdfDropzoneActive: string;
  pdfProcessing: string;
  pdfProcessingOcr: string;
  pdfErrorNoText: string;
  pdfErrorGeneric: string;
  scanCompletedNotice: string;

  // Form Sections
  customerSectionTitle: string;
  customerSectionSub: string;
  supplierSectionTitle: string;
  supplierSectionSub: string;
  invoiceSectionTitle: string;
  invoiceSectionSub: string;

  // Customer fields
  customerNameLabel: string;
  customerNamePlaceholder: string;
  customerVatLabel: string;
  customerVatPlaceholder: string;
  customerFiscalCodeLabel: string;
  customerFiscalCodePlaceholder: string;
  customerCountryLabel: string;
  customerCountryPlaceholder: string;
  customerCapLabel: string;
  customerCapPlaceholder: string;
  customerCityLabel: string;
  customerCityPlaceholder: string;
  customerProvinceLabel: string;
  customerProvincePlaceholder: string;
  customerAddressLabel: string;
  customerAddressPlaceholder: string;

  // Supplier fields
  supplierNameLabel: string;
  supplierNamePlaceholder: string;
  supplierVatLabel: string;
  supplierVatPlaceholder: string;
  supplierCountryLabel: string;
  supplierCountryPlaceholder: string;
  supplierCapLabel: string;
  supplierCapPlaceholder: string;
  supplierCityLabel: string;
  supplierCityPlaceholder: string;
  supplierAddressLabel: string;
  supplierAddressPlaceholder: string;

  // Invoice fields
  invoiceNumLabel: string;
  invoiceNumPlaceholder: string;
  invoiceDateLabel: string;
  invoiceDatePlaceholder: string;
  invoiceAmountLabel: string;
  invoiceAmountPlaceholder: string;
  invoiceDescLabel: string;
  invoiceDescPlaceholder: string;

  // Action Buttons
  generateBtn: string;
  sampleDataBtn: string;
  clearFieldsBtn: string;

  // Validation errors
  errRequiredFields: string;
  errDateFormat: string;
  errAmountNumber: string;

  // Field status
  notDetectedText: string;

  // Result Box
  resultSuccessTitle: string;
  resultSuccessDesc: string;
  downloadXmlBtn: string;
  copyXmlBtn: string;
  copiedNotice: string;
  viewXmlToggle: string;
  hideXmlToggle: string;

  // Footer notes
  footerStandard: string;
  footerOfflineNote: string;
}

export const translations: Record<Language, Translations> = {
  IT: {
    appTitle: "SelfInvoice XML Studio",
    appSubtitle: "Autofatture e Integrazioni (TD17 / TD18 / TD16)",
    headerBadge: "FPR12",
    langIt: "Italiano",
    langEn: "Inglese",
    themeLight: "Chiaro",
    themeDark: "Scuro",
    buyerSettingsBtn: "Impostazioni Predefinite",
    buyerSettingsTitle: "Dati Committente Predefiniti",
    buyerSettingsDesc: "Dati predefiniti memorizzati localmente nel browser.",
    saveSettings: "Salva Impostazioni",
    close: "Chiudi",

    docTypeLabel: "Tipo Documento",
    docTypeHint: "TD17 per servizi esteri (predefinito), TD18 per beni UE, TD16 per reverse charge interno",

    pdfDropzoneTitle: "Trascina qui la fattura (PDF, Scansione o Immagine)",
    pdfDropzoneSub: "Supporta file PDF, scansioni cartacee e immagini PNG/JPG. Elaborazione locale.",
    pdfDropzoneActive: "Rilascia il documento qui...",
    pdfProcessing: "Analisi documento in corso...",
    pdfProcessingOcr: "Riconoscimento caratteri in corso...",
    pdfErrorNoText: "Nessun testo leggibile rilevato nel documento.",
    pdfErrorGeneric: "Errore durante l'apertura del file.",
    scanCompletedNotice: "Scansione del documento completata con successo!",

    customerSectionTitle: "DATI COMMITTENTE (Cessionario)",
    customerSectionSub: "Soggetto italiano acquirente o committente del bene/servizio",
    supplierSectionTitle: "DATI FORNITORE (Cedente)",
    supplierSectionSub: "Fornitore estero o nazionale prestatore",
    invoiceSectionTitle: "DATI FATTURA",
    invoiceSectionSub: "Estremi del documento originale",

    customerNameLabel: "Ragione Sociale Committente:",
    customerNamePlaceholder: "Es. AZIENDA COMMITTENTE ESEMPIO S.R.L.",
    customerVatLabel: "Partita IVA Committente:",
    customerVatPlaceholder: "Es. 12345678901",
    customerFiscalCodeLabel: "Codice Fiscale Committente:",
    customerFiscalCodePlaceholder: "Es. 12345678901 o codice fiscale a 16 caratteri",
    customerCountryLabel: "Nazione:",
    customerCountryPlaceholder: "IT",
    customerCapLabel: "CAP:",
    customerCapPlaceholder: "Es. 00100",
    customerCityLabel: "Comune:",
    customerCityPlaceholder: "Es. ROMA",
    customerProvinceLabel: "Provincia:",
    customerProvincePlaceholder: "Es. RM",
    customerAddressLabel: "Indirizzo:",
    customerAddressPlaceholder: "Es. VIA ESEMPIO N 1",

    supplierNameLabel: "Nome Fornitore:",
    supplierNamePlaceholder: "Es. FORNITORE ESTERO ESEMPIO S.A.",
    supplierVatLabel: "P.IVA / Cod. Identificativo:",
    supplierVatPlaceholder: "Es. SK9999999999 / DE123456789",
    supplierCountryLabel: "Nazione (ISO 2):",
    supplierCountryPlaceholder: "Es. SK, DE, FR, IT",
    supplierCapLabel: "CAP:",
    supplierCapPlaceholder: "Es. 83104",
    supplierCityLabel: "Città:",
    supplierCityPlaceholder: "Es. Bratislava",
    supplierAddressLabel: "Indirizzo:",
    supplierAddressPlaceholder: "Es. VIA ESEMPIO N 10",

    invoiceNumLabel: "Numero Fattura:",
    invoiceNumPlaceholder: "Es. INV-2026-001",
    invoiceDateLabel: "Data (AAAA-MM-GG):",
    invoiceDatePlaceholder: "AAAA-MM-GG (Es. 2026-07-08)",
    invoiceAmountLabel: "Importo Imponibile (€):",
    invoiceAmountPlaceholder: "Es. 600.00",
    invoiceDescLabel: "Descrizione / Causale:",
    invoiceDescPlaceholder: "Es. Servizi di consulenza o fornitura beni",

    generateBtn: "GENERA E SALVA XML",
    sampleDataBtn: "Dati di prova",
    clearFieldsBtn: "Svuota campi",

    errRequiredFields: "Compila o correggi i campi contrassegnati con 'Dato non rilevato'",
    errDateFormat: "La data deve essere nel formato AAAA-MM-GG (es. 2026-07-08)",
    errAmountNumber: "L'importo deve essere un valore numerico valido (es. 600.00)",

    notDetectedText: "Dato non rilevato",

    resultSuccessTitle: "File XML generato con successo",
    resultSuccessDesc: "Il file è pronto per l'importazione in Profis o altri gestionali contabili.",
    downloadXmlBtn: "Scarica XML",
    copyXmlBtn: "Copia XML",
    copiedNotice: "XML copiato!",
    viewXmlToggle: "Mostra XML",
    hideXmlToggle: "Nascondi XML",

    footerStandard: "Formato conforme alle specifiche tecniche per la fatturazione elettronica (FPR12).",
    footerOfflineNote: "Elaborazione locale client-side: nessun dato viene inviato all'esterno.",
  },
  EN: {
    appTitle: "SelfInvoice XML Studio",
    appSubtitle: "Self-Invoicing & Reverse Charge (TD17 / TD18 / TD16)",
    headerBadge: "FPR12",
    langIt: "Italian",
    langEn: "English",
    themeLight: "Light",
    themeDark: "Dark",
    buyerSettingsBtn: "Default Buyer Settings",
    buyerSettingsTitle: "Default Buyer Settings",
    buyerSettingsDesc: "Default customer profile stored in your browser.",
    saveSettings: "Save Settings",
    close: "Close",

    docTypeLabel: "Document Type",
    docTypeHint: "TD17 for foreign services (default), TD18 for EU goods, TD16 for Italian reverse charge",

    pdfDropzoneTitle: "Drag & drop invoice here (PDF, Scan or Image)",
    pdfDropzoneSub: "Supports PDFs, paper scans and PNG/JPG images. Local processing.",
    pdfDropzoneActive: "Drop document here...",
    pdfProcessing: "Processing document...",
    pdfProcessingOcr: "Recognizing characters...",
    pdfErrorNoText: "No readable text detected in document.",
    pdfErrorGeneric: "Error opening file.",
    scanCompletedNotice: "Document scan successfully completed!",

    customerSectionTitle: "BUYER / CUSTOMER DETAILS",
    customerSectionSub: "Italian buyer acquiring the goods or services",
    supplierSectionTitle: "SUPPLIER DETAILS",
    supplierSectionSub: "Foreign or domestic vendor providing goods or services",
    invoiceSectionTitle: "INVOICE DETAILS",
    invoiceSectionSub: "Original document specifics",

    customerNameLabel: "Buyer Company Name:",
    customerNamePlaceholder: "e.g. SAMPLE BUYER COMPANY S.R.L.",
    customerVatLabel: "Buyer VAT Number:",
    customerVatPlaceholder: "e.g. 12345678901",
    customerFiscalCodeLabel: "Buyer Tax Code:",
    customerFiscalCodePlaceholder: "e.g. 12345678901 or 16-character alphanumeric code",
    customerCountryLabel: "Country:",
    customerCountryPlaceholder: "IT",
    customerCapLabel: "Postal Code:",
    customerCapPlaceholder: "e.g. 00100",
    customerCityLabel: "City:",
    customerCityPlaceholder: "e.g. ROME",
    customerProvinceLabel: "Province:",
    customerProvincePlaceholder: "e.g. RM",
    customerAddressLabel: "Address:",
    customerAddressPlaceholder: "e.g. SAMPLE STREET NO. 1",

    supplierNameLabel: "Supplier Name:",
    supplierNamePlaceholder: "e.g. SAMPLE FOREIGN SUPPLIER S.A.",
    supplierVatLabel: "VAT / Tax ID:",
    supplierVatPlaceholder: "e.g. SK9999999999 / DE123456789",
    supplierCountryLabel: "Country (ISO 2):",
    supplierCountryPlaceholder: "e.g. SK, DE, FR, IT",
    supplierCapLabel: "Postal Code:",
    supplierCapPlaceholder: "e.g. 83104",
    supplierCityLabel: "City:",
    supplierCityPlaceholder: "e.g. Bratislava",
    supplierAddressLabel: "Address:",
    supplierAddressPlaceholder: "e.g. SAMPLE STREET NO. 10",

    invoiceNumLabel: "Invoice Number:",
    invoiceNumPlaceholder: "e.g. INV-2026-001",
    invoiceDateLabel: "Date (YYYY-MM-DD):",
    invoiceDatePlaceholder: "YYYY-MM-DD (e.g. 2026-07-08)",
    invoiceAmountLabel: "Taxable Amount (€):",
    invoiceAmountPlaceholder: "e.g. 600.00",
    invoiceDescLabel: "Description / Reason:",
    invoiceDescPlaceholder: "e.g. Consulting services or goods delivery",

    generateBtn: "GENERATE AND SAVE XML",
    sampleDataBtn: "Sample data",
    clearFieldsBtn: "Clear fields",

    errRequiredFields: "Please complete or correct fields marked as 'Data not detected'",
    errDateFormat: "Date must be in YYYY-MM-DD format (e.g. 2026-07-08)",
    errAmountNumber: "Amount must be a valid numeric value (e.g. 600.00)",

    notDetectedText: "Data not detected",

    resultSuccessTitle: "XML file generated successfully",
    resultSuccessDesc: "The file is ready for import into accounting software.",
    downloadXmlBtn: "Download XML",
    copyXmlBtn: "Copy XML",
    copiedNotice: "XML copied!",
    viewXmlToggle: "Show XML",
    hideXmlToggle: "Hide XML",

    footerStandard: "Compliant with technical specifications for electronic invoicing (FPR12).",
    footerOfflineNote: "Client-side local processing: no data transmitted externally.",
  },
};
