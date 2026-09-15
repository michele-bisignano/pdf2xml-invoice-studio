import React, { useState } from "react";
import { Download, Copy, Check, Code2, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { Language } from "../types";
import { translations } from "../utils/i18n";

interface XmlResultProps {
  language: Language;
  xmlContent: string;
  filename: string;
  onDownload: () => void;
}

export const XmlResult: React.FC<XmlResultProps> = ({
  language,
  xmlContent,
  filename,
  onDownload,
}) => {
  const t = translations[language];
  const [copied, setCopied] = useState(false);
  const [showXml, setShowXml] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(xmlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="mt-6 p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {t.resultSuccessTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.resultSuccessDesc}
            </p>
            <div className="mt-1 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded inline-block border border-slate-200 dark:border-slate-700">
              {filename}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.downloadXmlBtn}</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-slate-900 dark:text-slate-100" />
                <span className="text-slate-900 dark:text-slate-100 font-bold">{t.copiedNotice}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t.copyXmlBtn}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowXml(!showXml)}
            className="inline-flex items-center space-x-1 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{showXml ? t.hideXmlToggle : t.viewXmlToggle}</span>
            {showXml ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible XML Preview */}
      {showXml && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="relative rounded-lg overflow-hidden bg-slate-950 text-slate-100 text-xs font-mono border border-slate-800 p-3.5 max-h-72 overflow-y-auto">
            <pre className="whitespace-pre-wrap select-all">{xmlContent}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
