import React, { useState } from "react";
import { X, Building2, Save, RotateCcw } from "lucide-react";
import { CustomerData, Language, DEFAULT_CUSTOMER } from "../types";
import { translations } from "../utils/i18n";

interface BuyerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  customer: CustomerData;
  onSaveCustomer: (data: CustomerData) => void;
}

export const BuyerSettingsModal: React.FC<BuyerSettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  customer,
  onSaveCustomer,
}) => {
  const t = translations[language];
  const [formData, setFormData] = useState<CustomerData>({ ...customer });

  if (!isOpen) return null;

  const handleChange = (field: keyof CustomerData, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCustomer(formData);
    onClose();
  };

  const handleResetToDefault = () => {
    setFormData({ ...DEFAULT_CUSTOMER });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.buyerSettingsTitle}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t.buyerSettingsDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.buyerNameLabel}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.customerVatLabel}
              </label>
              <input
                type="text"
                required
                value={formData.vat}
                onChange={(e) => handleChange("vat", e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.customerFiscalCodeLabel}
              </label>
              <input
                type="text"
                value={formData.fiscalCode || ""}
                onChange={(e) => handleChange("fiscalCode", e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono uppercase focus:ring-2 focus:ring-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.buyerAddressLabel}
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.buyerCapLabel}
              </label>
              <input
                type="text"
                value={formData.cap}
                onChange={(e) => handleChange("cap", e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.buyerCityLabel}
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.buyerProvinceLabel}
              </label>
              <input
                type="text"
                maxLength={2}
                value={formData.province}
                onChange={(e) => handleChange("province", e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 uppercase focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t.close}
              </button>
              <button
                type="submit"
                className="inline-flex items-center space-x-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t.saveSettings}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
