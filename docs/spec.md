# Technical and Functional Specifications: Profis Foreign Invoice XML Generator (TD17)

## 1. Project Overview
The **Profis Foreign Invoice XML Generator** is a 100% local, offline utility designed for accounting firms and administrative teams using **Sistemi Profis**.

It converts foreign supplier invoice data (EU and non-EU) into official electronic invoice XML files conforming to the Italian Revenue Agency (*Agenzia delle Entrate*) standard:
- **FPR12 schema**: Technical format for B2B/B2C electronic invoices and self-invoices.
- **Document Type TD17**: Integration / self-invoice for foreign services purchase.

The tool is provided in two synchronized interfaces:
1. **Desktop GUI Application** (Python Tkinter, packagable into standalone `.exe` via PyInstaller).
2. **Local Web App** (React 19, TypeScript, Tailwind CSS, runnable offline on localhost).

---

## 2. Core Requirements & Scope Boundaries
- **No External AI or Cloud APIs**: 100% offline, privacy-first, zero third-party API keys required.
- **Zero Sensitive Data**: All default and sample configurations use anonymous generic placeholders (e.g., `AZIENDA COMMITTENTE ESEMPIO S.R.L.`, VAT `12345678901`).
- **Faithful Tkinter Single-Window Layout**: Exactly 10 input fields organized in two clear sections:
  - **Section 1: Foreign Supplier Data** (Name, VAT / Foreign ID, Country, 5-digit Postal Code, City, Address).
  - **Section 2: Invoice Data** (Invoice Number, Date YYYY-MM-DD, Taxable Amount, Description / Reason).
  - **Primary Action**: "GENERA E SALVA XML" button (`#16a34a` green, white bold text).
- **Auxiliary Controls**: Discrete bilingual language switch (IT/EN) and Dark Mode toggle.
- **Codebase Language**: English throughout the codebase (variable names, types, functions, comments, test scripts, documentation), with bilingual user interface.

---

## 3. Technology Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide icons.
- **Backend / Dev Server**: Node.js, Express (local static server & Vite dev integration).
- **Desktop Application**: Python 3 standard library (`tkinter`, `xml.sax.saxutils`, `xml.etree.ElementTree`).
- **Desktop Packaging**: PyInstaller for single-file Windows executable generation.
- **Local Launcher**: `start_local.py` for automated browser launch and clean shutdown.
