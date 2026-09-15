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

## 📦 Building the Standalone Windows Executable (.exe)

### Method 1: Using the Batch Script (Windows)
1. Navigate to the `python_script/` folder.
2. Double-click `build_exe.bat`.
3. The standalone binary `GeneratoreXML_Profis.exe` will be generated in `python_script/dist/`.

### Method 2: Manual Command Line
```bash
cd python_script
pip install -r requirements.txt
pyinstaller --noconsole --onefile --name "GeneratoreXML_Profis" generatore_xml.py
```

---

## 💻 Running the Python Script Directly

```bash
python3 python_script/generatore_xml.py
```

---

## 🧪 Running Unit Tests

```bash
python3 python_script/test_generator.py
```

---

## 🌐 Running the Local Web App

### Quick Start with Auto-Browser Launcher:
```bash
python3 start_local.py
```

### Manual Start:
```bash
npm install
npm run dev
```
Then open `http://localhost:3000` in your web browser.

---

## 📂 Project Structure

```text
├── start_local.py           # Python script to launch local web server and open browser
├── python_script/
│   ├── generatore_xml.py    # Desktop Tkinter GUI application
│   ├── test_generator.py    # Python unit tests for XML generation
│   ├── requirements.txt     # Python dependencies (pyinstaller)
│   └── build_exe.bat        # Windows batch build script for PyInstaller
├── src/
│   ├── App.tsx              # Single-window web UI faithful to Tkinter (bilingual IT/EN, Dark Mode)
│   ├── types.ts             # TypeScript interfaces and default anonymous test data
│   ├── utils/
│   │   └── xmlGenerator.ts  # XML generation and XML character escaping
│   ├── index.css            # Tailwind CSS styles
│   └── main.tsx             # Application entry point
├── docs/                    # Project specifications and architecture
├── server.ts                # Local Express server serving Vite app
├── package.json             # NPM package scripts and dependencies
└── README.md                # Project documentation
```

---

## 📜 License
Released under the [MIT License](LICENSE).
