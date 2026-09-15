import React from "react";
import {
  Sparkles,
  Trash2,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import {
  SupplierData,
  CustomerData,
  InvoiceData,
  DocumentType,
  DOCUMENT_TYPES,
  Language,
} from "../types";
import { translations } from "../utils/i18n";
import { ValidationSummary, FieldValidationState } from "../utils/validation";

interface InvoiceFormProps {
  language: Language;
  customer: CustomerData;
  onCustomerChange: (field: keyof CustomerData, value: string) => void;
  supplier: SupplierData;
  onSupplierChange: (field: keyof SupplierData, value: string) => void;
  invoice: InvoiceData;
  onInvoiceChange: (field: keyof InvoiceData, value: string) => void;
  onDocTypeChange: (docType: DocumentType) => void;
  onGenerate: () => void;
  onLoadSample: () => void;
  onClear: () => void;
  error: string | null;
  hasExtractedFile: boolean;
  validation: ValidationSummary;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  language,
  customer,
  onCustomerChange,
  supplier,
  onSupplierChange,
  invoice,
  onInvoiceChange,
  onDocTypeChange,
  onGenerate,
  onLoadSample,
  onClear,
  error,
  validation,
}) => {
  const t = translations[language];

  // Helper for input styling:
  // Correct fields do NOT illuminate (clean standard styling).
  // Wrong/missing fields are highlighted in red.
  const getInputClasses = (fieldState: FieldValidationState, isMono: boolean = false) => {
    const base = `w-full px-3 py-2 text-sm rounded-lg border transition-colors shadow-2xs ${
      isMono ? "font-mono" : ""
    }`;

    if (fieldState.isError) {
      return `${base} border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-950 dark:text-rose-100 placeholder-rose-300 dark:placeholder-rose-700 focus:ring-2 focus:ring-rose-500 focus:border-rose-500`;
    }

    return `${base} border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-slate-400 focus:border-slate-500`;
  };

  // Helper for field status:
  // Only shows "Dato non rilevato" in red if invalid/missing.
  // Correct fields have NO badge and do NOT display "(RILEVATO)".
  const renderFieldStatus = (fieldState: FieldValidationState) => {
    if (fieldState.isError) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{t.notDetectedText}</span>
        </span>
      );
    }
    return null;
  };

  return (
    <form
      id="invoice-form"
      onSubmit={(e) => {
        e.preventDefault();
        onGenerate();
      }}
      className="space-y-6"
    >
      {/* Document Type Selector (TD17 / TD18 / TD16) */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label
              htmlFor="docTypeSelect"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
            >
              {t.docTypeLabel}
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.docTypeHint}
            </p>
          </div>
          <select
            id="docTypeSelect"
            value={invoice.documentType}
            onChange={(e) => onDocTypeChange(e.target.value as DocumentType)}
            className="px-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-400 shadow-2xs cursor-pointer"
          >
            {DOCUMENT_TYPES.map((dt) => (
              <option key={dt.code} value={dt.code}>
                {language === "IT" ? dt.labelIt : dt.labelEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION 1: DATI COMMITTENTE (Cessionario/Committente) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <h2 className="text-sm font-bold tracking-wide text-slate-900 dark:text-slate-100 uppercase">
            {t.customerSectionTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {t.customerSectionSub}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Ragione Sociale Committente */}
          <div className="sm:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="cust_name"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {t.customerNameLabel} <span className="text-rose-500">*</span>
              </label>
              {renderFieldStatus(validation.fields.customerName)}
            </div>
            <input
              id="cust_name"
              type="text"
              required
              value={customer.name}
              onChange={(e) => onCustomerChange("name", e.target.value)}
              placeholder={t.customerNamePlaceholder}
              className={getInputClasses(validation.fields.customerName)}
            />
          </div>

          {/* Partita IVA Committente */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="cust_vat"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {t.customerVatLabel} <span className="text-rose-500">*</span>
              </label>
              {renderFieldStatus(validation.fields.customerVat)}
            </div>
            <input
              id="cust_vat"
              type="text"
              required
              value={customer.vat}
              onChange={(e) => onCustomerChange("vat", e.target.value)}
              placeholder={t.customerVatPlaceholder}
              className={getInputClasses(validation.fields.customerVat, true)}
            />
          </div>

          {/* Codice Fiscale Committente */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="cust_fiscal_code"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {t.customerFiscalCodeLabel}
              </label>
              {renderFieldStatus(validation.fields.customerFiscalCode)}
            </div>
            <input
              id="cust_fiscal_code"
              type="text"
              value={customer.fiscalCode || ""}
              onChange={(e) => onCustomerChange("fiscalCode", e.target.value.toUpperCase())}
              placeholder={t.customerFiscalCodePlaceholder}
              className={getInputClasses(validation.fields.customerFiscalCode, true)}
            />
          </div>

          {/* Nazione Committente */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="cust_country"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {t.customerCountryLabel} <span className="text-rose-500">*</span>
              </label>
              {renderFieldStatus(validation.fields.customerCountry)}
            </div>
            <input
              id="cust_country"
              type="text"
              required
              maxLength={2}
              value={customer.country}
              onChange={(e) => onCustomerChange("country", e.target.value.toUpperCase())}
              placeholder={t.customerCountryPlaceholder}
              className={getInputClasses(validation.fields.customerCountry, true)}
            />
          </div>

          {/* CAP Committente */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="cust_cap"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {t.customerCapLabel}
              </label>
              {renderFieldStatus(validation.fields.customerCap)}
            </div>
            <input
              id="cust_cap"
              type="text"
              value={customer.cap}
              onChange={(e) => onCustomerChange("cap", e.target.value)}
              placeholder={t.customerCapPlaceholder}
              className={getInputClasses(validation.fields.customerCap)}
            />
          </div>

          {/* Comune Committente */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="cust_city"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {t.customerCityLabel}
              </label>
              {renderFieldStatus(validation.fields.customerCity)}
            </div>
            <input
              id="cust_city"
              type="text"
              value={customer.city}
              onChange={(e) => onCustomerChange("city", e.target.value)}
              placeholder={t.customerCityPlaceholder}
              className={getInputClasses(validation.fields.customerCity)}
            />
          </div>

          {/* Indirizzo Committente */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="cust_address"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {t.customerAddressLabel}
              </label>
              {renderFieldStatus(validation.fields.customerAddress)}
            </div>
            <input
              id="cust_address"
              type="text"
              value={customer.address}
              onChange={(e) => onCustomerChange("address", e.target.value)}
              placeholder={t.customerAddressPlaceholder}
              className={getInputClasses(validation.fields.customerAddress)}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: DATI FORNITORE (Cedente/Prestatore) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <h2 className="text-sm font-bold tracking-wide text-slate-900 dark:text-slate-100 uppercase">
            {t.supplierSectionTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {t.supplierSectionSub}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nome Fornitore */}
          <div className="sm:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="supp_name"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {t.supplierNameLabel} <span className="text-rose-500">*</span>
              </label>
              {renderFieldStatus(validation.fields.supplierName)}
            </div>
            <input
              id="supp_name"
              type="text"
              required
              value={supplier.name}
              onChange={(e) => onSupplierChange("name", e.target.value)}
              placeholder={t.supplierNamePlaceholder}
              className={getInputClasses(validation.fields.supplierName)}
            />
          </div>

          {/* P.IVA / Cod. Estero */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="supp_vat"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {t.supplierVatLabel} <span className="text-rose-500">*</span>
              </label>
              {renderFieldStatus(validation.fields.supplierVat)}
            </div>
            <input
              id="supp_vat"
              type="text"
              required
              value={supplier.vat}
              onChange={(e) => onSupplierChange("vat", e.target.value)}
              placeholder={t.supplierVatPlaceholder}
              className={getInputClasses(validation.fields.supplierVat, true)}
            />
          </div>

          {/* Nazione Fornitore */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="supp_country"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {t.supplierCountryLabel} <span className="text-rose-500">*</span>
              </label>
              {renderFieldStatus(validation.fields.supplierCountry)}
            </div>
            <input
              id="supp_country"
              type="text"
              required
              maxLength={2}
              value={supplier.country}
              onChange={(e) => onSupplierChange("country", e.target.value.toUpperCase())}
              placeholder={t.supplierCountryPlaceholder}
              className={getInputClasses(validation.fields.supplierCountry, true)}
            />
          </div>

          {/* CAP Fornitore */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="supp_cap"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {t.supplierCapLabel}
              </label>
              {renderFieldStatus(validation.fields.supplierCap)}
            </div>
            <input
              id="supp_cap"
              type="text"
              value={supplier.cap}
              onChange={(e) => onSupplierChange("cap", e.target.value)}
              placeholder={t.supplierCapPlaceholder}
              className={getInputClasses(validation.fields.supplierCap)}
            />
          </div>

          {/* Città Fornitore */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="supp_city"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {t.supplierCityLabel}
              </label>
              {renderFieldStatus(validation.fields.supplierCity)}
            </div>
            <input
              id="supp_city"
              type="text"
              value={supplier.city}
              onChange={(e) => onSupplierChange("city", e.target.value)}
              placeholder={t.supplierCityPlaceholder}
              className={getInputClasses(validation.fields.supplierCity)}
            />
          </div>

          {/* Indirizzo Fornitore */}
          <div className="sm:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="supp_addr"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {t.supplierAddressLabel}
              </label>
              {renderFieldStatus(validation.fields.supplierAddress)}
            </div>
            <input
              id="supp_addr"
              type="text"
              value={supplier.address}
              onChange={(e) => onSupplierChange("address", e.target.value)}
              placeholder={t.supplierAddressPlaceholder}
              className={getInputClasses(validation.fields.supplierAddress)}
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: DATI FATTURA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <h2 className="text-sm font-bold tracking-wide text-slate-900 dark:text-slate-100 uppercase">
            {t.invoiceSectionTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {t.invoiceSectionSub}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Numero Fattura */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="inv_num"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {t.invoiceNumLabel} <span className="text-rose-500">*</span>
              </label>
              {renderFieldStatus(validation.fields.invoiceNumber)}
            </div>
            <input
              id="inv_num"
              type="text"
              required
              value={invoice.invoiceNumber}
              onChange={(e) => onInvoiceChange("invoiceNumber", e.target.value)}
              placeholder={t.invoiceNumPlaceholder}
              className={getInputClasses(validation.fields.invoiceNumber, true)}
            />
          </div>

          {/* Data Fattura */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="inv_date"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {t.invoiceDateLabel} <span className="text-rose-500">*</span>
              </label>
              {renderFieldStatus(validation.fields.invoiceDate)}
            </div>
            <input
              id="inv_date"
              type="text"
              required
              value={invoice.invoiceDate}
              onChange={(e) => onInvoiceChange("invoiceDate", e.target.value)}
              placeholder={t.invoiceDatePlaceholder}
              className={getInputClasses(validation.fields.invoiceDate, true)}
            />
          </div>

          {/* Importo Imponibile */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="inv_amount"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {t.invoiceAmountLabel} <span className="text-rose-500">*</span>
              </label>
              {renderFieldStatus(validation.fields.invoiceAmount)}
            </div>
            <input
              id="inv_amount"
              type="text"
              required
              value={invoice.amount}
              onChange={(e) => onInvoiceChange("amount", e.target.value)}
              placeholder={t.invoiceAmountPlaceholder}
              className={getInputClasses(validation.fields.invoiceAmount, true)}
            />
          </div>

          {/* Descrizione / Causale */}
          <div className="sm:col-span-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="inv_desc"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {t.invoiceDescLabel}
              </label>
              {renderFieldStatus(validation.fields.invoiceDescription)}
            </div>
            <textarea
              id="inv_desc"
              rows={2}
              value={invoice.description}
              onChange={(e) => onInvoiceChange("description", e.target.value)}
              placeholder={t.invoiceDescPlaceholder}
              className={getInputClasses(validation.fields.invoiceDescription)}
            />
          </div>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ACTION CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Reset / Sample Buttons */}
        <div className="flex items-center space-x-2 order-2 sm:order-1">
          <button
            id="sample-data-btn"
            type="button"
            onClick={onLoadSample}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.sampleDataBtn}</span>
          </button>
          <button
            id="clear-fields-btn"
            type="button"
            onClick={onClear}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.clearFieldsBtn}</span>
          </button>
        </div>

        {/* Primary Submit Button */}
        <button
          id="generate-xml-btn"
          type="submit"
          className="order-1 sm:order-2 inline-flex items-center justify-center space-x-2 px-6 py-2.5 text-sm font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
        >
          <FileCheck className="w-4 h-4" />
          <span>{t.generateBtn}</span>
        </button>
      </div>
    </form>
  );
};
