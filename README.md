<p align="center">
  <img src="public/icon.png" width="100" alt="SelfInvoice XML Studio Logo" />
</p>

# 🧾 Profis Foreign Invoice XML Generator (TD17)

> **100% local, offline, and lightweight tool to convert foreign supplier invoice data into Agenzia delle Entrate compliant XML files (FPR12 standard, Document Type TD17) for direct import into Sistemi Profis accounting software.**

Available in two synchronized modes:
1. **Desktop GUI Application** (`python_script/generatore_xml.py`): Native Python Tkinter interface compilable into a standalone Windows `.exe` via PyInstaller.
2. **Local Web App** (`src/`): React 19 + TypeScript + Tailwind CSS application runnable on `localhost:3000` or in web preview with bilingual support (IT/EN) and Dark Mode.

---

## 📌 Context and Purpose

In Italy, recording foreign invoices (EU and non-EU) requires generating integration documents / self-invoices (TD17) conforming to the Agenzia delle Entrate electronic invoicing standard (`FPR12`).

Accounting firms and administrative teams using **Sistemi Profis** often need to process foreign invoices quickly without relying on external cloud APIs or uploading confidential financial data to third parties.

This tool provides a lightweight, strictly offline solution:
- **100% Offline & Private**: Zero external API calls, zero AI dependencies, zero sensitive company data stored.
- **Strictly Scoped Input**: Exactly 10 essential fields matching the original workflow:
  - **Foreign Supplier Data**: Name, VAT / Foreign ID, Country (e.g., SK), Postal Code (5 digits), City, Address.
  - **Invoice Data**: Invoice Number, Date (YYYY-MM-DD), Taxable Amount, Description / Reason.
- **Profis Compliant Output**: Generates valid XML (`FPR12`, `TD17`, VAT Nature `N6.1`, "Inversione contabile") ready for import into Profis.

---

## 🚀 Key Features

- 🛡️ **Data Validation & XML Escaping**: Validates required fields, date format (`YYYY-MM-DD`), and numeric amounts, escaping XML special characters (`&`, `<`, `>`, `"`, `'`).
- 🖥️ **Tkinter Desktop GUI**: Native 450x520px window, no heavy dependencies, compiles to a standalone `.exe`.
- 🌐 **Local Web Application**: Faithful single-window interface (450-460px width) matching Tkinter layout, with discrete IT/EN language switch and Dark Mode toggle.
- ⚡ **Single-Click Local Launch**: Includes `start_local.py` for starting on `http://localhost:3000`, opening the browser automatically, and cleanly terminating background processes.
- 🧪 **Unit Tests**: Automated test suite (`python_script/test_generator.py`) ensuring schema validity and zero regressions.

---

## 📦 Windows Executable Creation (Standalone .exe)

By double-clicking on **`build_win.bat`** on Windows:
1. Checks for Node.js and npm availability.
2. Runs `npm install` to install all dependencies.
3. Builds the application with `npm run build`.
4. Packages the server and frontend into a single native Windows x64 executable: **`dist\GeneratoreXML.exe`**.

Double-clicking `dist\GeneratoreXML.exe` starts the app and automatically opens the browser at `http://localhost:3000`.

---

## 🌐 Development Start

```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 📂 Project Structure

```text
├── build_win.bat            # Batch script to create GeneratoreXML.exe on Windows
├── server.ts                # Local Express server with SPA routing and auto-browser launch
├── src/
│   ├── App.tsx              # Main application component
│   ├── types.ts             # TypeScript definitions and default data
│   ├── components/
│   │   ├── Header.tsx       # Top bar with logo, language and theme switcher
│   │   ├── PdfDropzone.tsx  # PDF & image drag-and-drop area with offline OCR
│   │   ├── InvoiceForm.tsx  # Customer, Supplier, and Invoice form
│   │   ├── XmlResult.tsx    # XML preview with download and copy
│   │   └── BuyerSettingsModal.tsx # Saved customer profile settings
│   └── utils/
│       ├── i18n.ts          # Bilingual translations (Italian/English)
│       ├── pdfExtractor.ts  # Native PDF parsing and client-side Tesseract OCR engine
│       ├── validation.ts    # Real-time validation of mandatory SDI fields
│       └── xmlGenerator.ts  # XML FPR12 layout generation compliant with Agenzia delle Entrate
├── package.json             # Dependencies and build scripts
└── README.md                # Project documentation
```

---

## 📜 License
Released under the [MIT License](LICENSE).
