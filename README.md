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

## 📦 Creazione Eseguibile Windows (.exe Standalone)

Facendo doppio click su **`build_win.bat`** da Windows:
1. Verifica la presenza di Node.js e npm.
2. Esegue `npm install` per installare tutte le dipendenze.
3. Compila l'applicazione con `npm run build`.
4. Pacchettizza il server e il frontend in un singolo file eseguibile nativo per Windows x64: **`dist\GeneratoreXML.exe`**.

Facendo doppio click su `dist\GeneratoreXML.exe`, l'app viene avviata e apre automaticamente il browser all'indirizzo `http://localhost:3000`.

---

## 🌐 Avvio in Sviluppo

```bash
npm install
npm run dev
```
Apri `http://localhost:3000` nel browser.

---

## 📂 Struttura del Progetto

```text
├── build_win.bat            # Script batch per creare GeneratoreXML.exe su Windows
├── server.ts                # Server Express locale con routing SPA e auto-apertura browser
├── src/
│   ├── App.tsx              # Componente principale dell'applicazione
│   ├── types.ts             # Definizioni TypeScript e dati di default
│   ├── components/
│   │   ├── Header.tsx       # Barra superiore con logo, switch lingua e tema
│   │   ├── PdfDropzone.tsx  # Area drag & drop PDF e immagini con OCR offline
│   │   ├── InvoiceForm.tsx  # Form dati Committente, Fornitore e Fattura
│   │   ├── XmlResult.tsx    # Anteprima XML con download e copia
│   │   └── BuyerSettingsModal.tsx # Impostazioni profilo committente salvato
│   └── utils/
│       ├── i18n.ts          # Traduzioni bilingue (Italiano/Inglese)
│       ├── pdfExtractor.ts  # Parsing PDF nativo e motore OCR Tesseract client-side
│       ├── validation.ts    # Validazione real-time dei campi obbligatori SDI
│       └── xmlGenerator.ts  # Generazione tracciato XML FPR12 conforme ad Agenzia delle Entrate
├── package.json             # Dipendenze e script di build
└── README.md                # Documentazione del progetto
```

---

## 📜 License
Released under the [MIT License](LICENSE).
