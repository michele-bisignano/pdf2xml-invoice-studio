# SelfInvoice XML Studio - Technical Specification

## 1. Overview
SelfInvoice XML Studio is a professional, offline-first desktop and web application designed for Italian accountants, enterprises, and professionals using Sistemi Profis or similar ERP software. It automates the generation of electronic invoices (`Fattura Elettronica` in XML format `FPR12`) for foreign transactions (TD17 purchase of services from abroad, TD18 EU goods purchase, TD19 goods in VAT warehouse / integration).

## 2. Key Functional Requirements
- **PDF & Image Import**: Drag & drop support for PDF invoices, PNG, JPEG, and TIFF images.
- **Offline OCR & Parsing**: Client-side OCR (`tesseract.js`) and digital PDF text parsing (`pdf.js`) extracting supplier, customer, and invoice details without sending sensitive financial documents to external servers.
- **Smart Autofill**: Automatic mapping of extracted fields into the invoicing form, with visual badges indicating extracted data and quick buttons to reload saved profile defaults.
- **Real-Time Validation**: Instant feedback highlighting missing or invalid SDI fields (Partita IVA, Codice Fiscale, CAP, Aliquota IVA, Natura IVA, importi).
- **XML Generation (`FPR12`)**: Conformance to Agenzia delle Entrate specifications with proper escaping, date formatting, line details, and summary blocks (`DatiRiepilogo`).
- **Standalone Windows Distribution (`.exe`)**: Zero-dependency packaging via `build_win.bat` and `pkg` yielding a self-contained executable that auto-launches the local web UI in the default browser.

## 3. Technology Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, `pdfjs-dist`, `tesseract.js`.
- **Backend / Server**: Node.js, Express, TypeScript (`server.ts`).
- **Packaging**: `@yao-pkg/pkg` for standalone binary creation.
