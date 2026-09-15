# SelfInvoice XML Studio - Implementation Plan

## Phase 1: Core Architecture & UI Foundation
- Responsive single-window layout with bilingual support (Italian/English) and Dark Mode.
- Modular components: Header, BuyerSettingsModal, PdfDropzone, InvoiceForm, XmlResult.
- Persistent user settings (`localStorage`) for default buyer (company data, VAT, fiscal code, address).

## Phase 2: Offline PDF Extraction & OCR Engine
- **Digital PDFs**: Coordinate-based text extraction using `pdf.js` to preserve line breaks and block structure.
- **Scanned PDFs / Images**: Client-side OCR using `tesseract.js` with Italian/English language trained data.
- **Extraction Heuristics**: Regex-based parsing to extract supplier details, customer/buyer details (name, VAT, CF, address, city, CAP, province), invoice number, date, amount, description, and auto-detect document type (TD17, TD18, TD19).

## Phase 3: Real-Time SDI Validation & XML Generation
- **Validation Engine**: Real-time validation checks for mandatory Agenzia delle Entrate fields (P.IVA, Codice Fiscale, CAP, amounts, VAT rates, <Natura> rules for zero VAT).
- **XML Generator**: Strict compliance with tracciato `FPR12` (Fattura Elettronica) for foreign invoices (integrazioni / autofatture).

## Phase 4: Standalone Deployment & Windows Executable (.exe)
- Express backend (`server.ts`) with SPA fallback and auto-browser launcher on startup.
- Windows batch build script (`build_win.bat`) for full dependency install, frontend/backend build, and native Windows x64 binary packaging (`GeneratoreXML.exe` via `@yao-pkg/pkg`).
