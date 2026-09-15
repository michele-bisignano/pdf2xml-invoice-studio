import React, { useState, useRef } from "react";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import { Language, ExtractedPdfData } from "../types";
import { translations } from "../utils/i18n";
import { extractInvoiceDataFromFile } from "../utils/pdfExtractor";

interface PdfDropzoneProps {
  language: Language;
  onDataExtracted: (extracted: ExtractedPdfData, fileName: string) => void;
}

export const PdfDropzone: React.FC<PdfDropzoneProps> = ({ language, onDataExtracted }) => {
  const t = translations[language];
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    const fileName = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || fileName.endsWith(".pdf");
    const isImage =
      file.type.startsWith("image/") ||
      fileName.endsWith(".png") ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".webp") ||
      fileName.endsWith(".tiff");

    if (!isPdf && !isImage) {
      return;
    }

    setIsLoading(true);
    setSuccessMessage(null);
    setProgressPercent(10);
    setProgressText(language === "IT" ? "Elaborazione documento..." : "Processing document...");

    try {
      const extracted = await extractInvoiceDataFromFile(file, (msg, pct) => {
        setProgressText(msg);
        setProgressPercent(pct);
      });

      setSuccessMessage(`${t.scanCompletedNotice} — ${file.name}`);
      onDataExtracted(extracted, file.name);
    } catch (err: any) {
      console.error("Document extraction error:", err);
    } finally {
      setIsLoading(false);
      setProgressPercent(0);
      setProgressText("");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        id="pdf-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed rounded-xl p-5 text-center transition-all duration-200 ${
          isDragging
            ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm scale-[1.005]"
            : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-emerald-400 dark:hover:border-emerald-600"
        }`}
      >
        <input
          id="pdf-file-input"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp,image/tiff"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2.5">
          {isLoading ? (
            <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center space-y-2.5 py-2">
              <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400">
                <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                <span className="text-sm font-semibold">{progressText || t.pdfProcessing}</span>
              </div>
              
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 dark:bg-emerald-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(progressPercent, 15)}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="p-2.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 ring-4 ring-emerald-50 dark:ring-emerald-900/30 transition-transform group-hover:scale-110">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {isDragging ? t.pdfDropzoneActive : t.pdfDropzoneTitle}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md mx-auto">
                  {t.pdfDropzoneSub}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="mt-2.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 font-semibold flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
};
