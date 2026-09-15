#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Profis Foreign Invoice XML Generator (TD17).
Generates Agenzia delle Entrate FPR12 compliant XML files for Sistemi Profis accounting software.
100% offline, lightweight desktop GUI with Tkinter.
"""

import tkinter as tk
from tkinter import filedialog, messagebox
import datetime
from xml.sax.saxutils import escape as xml_escape


def clean_and_escape(value):
    """Sanitize and escape XML special characters."""
    if value is None:
        return ""
    return xml_escape(str(value).strip())


def generate_xml():
    """Extract form inputs, validate required fields, and save the XML file."""
    # Retrieve supplier fields
    supplier_name = entry_supp_name.get().strip()
    supplier_vat = entry_supp_vat.get().strip()
    supplier_country = entry_supp_country.get().strip().upper()
    supplier_cap = entry_supp_cap.get().strip()
    supplier_city = entry_supp_city.get().strip()
    supplier_addr = entry_supp_addr.get().strip()

    # Retrieve invoice fields
    invoice_num = entry_inv_num.get().strip()
    invoice_date = entry_inv_date.get().strip()
    invoice_amount = entry_inv_amount.get().strip()
    invoice_desc = entry_inv_desc.get().strip()

    # Validate required fields
    if not supplier_name or not supplier_vat or not invoice_num or not invoice_date or not invoice_amount:
        messagebox.showerror("Errore", "Compila tutti i campi obbligatori!")
        return

    # Validate date format (YYYY-MM-DD)
    try:
        datetime.datetime.strptime(invoice_date, "%Y-%m-%d")
    except ValueError:
        messagebox.showerror("Errore", "La data deve essere nel formato AAAA-MM-GG (es. 2026-07-08)")
        return

    # Validate numeric amount
    try:
        amount_float = float(invoice_amount.replace(",", "."))
        formatted_amount = f"{amount_float:.2f}"
    except ValueError:
        messagebox.showerror("Errore", "L'importo deve essere un valore numerico valido (es. 600.00)")
        return

    # Generate sending progressive code (last 5 digits of timestamp)
    progressive = datetime.datetime.now().strftime("%Y%m%d%H%M%S")[-5:]

    # Build XML compliant with Agenzia delle Entrate FPR12 (TD17)
    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="FPR12" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <IdTrasmittente>
        <IdPaese>IT</IdPaese>
        <IdCodice>12345678901</IdCodice>
      </IdTrasmittente>
      <ProgressivoInvio>{progressive}</ProgressivoInvio>
      <FormatoTrasmissione>FPR12</FormatoTrasmissione>
      <CodiceDestinatario>0000000</CodiceDestinatario>
    </DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA>
          <IdPaese>{clean_and_escape(supplier_country)}</IdPaese>
          <IdCodice>{clean_and_escape(supplier_vat)}</IdCodice>
        </IdFiscaleIVA>
        <Anagrafica>
          <Denominazione>{clean_and_escape(supplier_name)}</Denominazione>
        </Anagrafica>
        <RegimeFiscale>RF01</RegimeFiscale>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>{clean_and_escape(supplier_addr)}</Indirizzo>
        <CAP>{clean_and_escape(supplier_cap)}</CAP>
        <Comune>{clean_and_escape(supplier_city)}</Comune>
        <Nazione>{clean_and_escape(supplier_country)}</Nazione>
      </Sede>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        <IdFiscaleIVA>
          <IdPaese>IT</IdPaese>
          <IdCodice>12345678901</IdCodice>
        </IdFiscaleIVA>
        <Anagrafica>
          <Denominazione>AZIENDA COMMITTENTE ESEMPIO S.R.L.</Denominazione>
        </Anagrafica>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>VIA ESEMPIO N 1</Indirizzo>
        <CAP>00100</CAP>
        <Comune>ROMA</Comune>
        <Provincia>RM</Provincia>
        <Nazione>IT</Nazione>
      </Sede>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>TD17</TipoDocumento>
        <Divisa>EUR</Divisa>
        <Data>{clean_and_escape(invoice_date)}</Data>
        <Numero>{clean_and_escape(invoice_num)}</Numero>
        <ImportoTotaleDocumento>{formatted_amount}</ImportoTotaleDocumento>
        <Causale>{clean_and_escape(invoice_desc)}</Causale>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      <DettaglioLinee>
        <NumeroLinea>1</NumeroLinea>
        <Descrizione>{clean_and_escape(invoice_desc)}</Descrizione>
        <Quantita>1.00</Quantita>
        <PrezzoUnitario>{formatted_amount}</PrezzoUnitario>
        <PrezzoTotale>{formatted_amount}</PrezzoTotale>
        <AliquotaIVA>0.00</AliquotaIVA>
        <Natura>N6.1</Natura>
      </DettaglioLinee>
      <DatiRiepilogo>
        <AliquotaIVA>0.00</AliquotaIVA>
        <Natura>N6.1</Natura>
        <ImponibileImporto>{formatted_amount}</ImponibileImporto>
        <Imposta>0.00</Imposta>
        <RiferimentoNormativo>Inversione contabile</RiferimentoNormativo>
      </DatiRiepilogo>
    </DatiBeniServizi>
  </FatturaElettronicaBody>
</p:FatturaElettronica>"""

    file_path = filedialog.asksaveasfilename(
        defaultextension=".xml",
        filetypes=[("XML files", "*.xml"), ("All files", "*.*")],
        initialfile=f"IT12345678901_{invoice_num}.xml"
    )
    if file_path:
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(xml_content)
            messagebox.showinfo("Successo", f"File XML salvato correttamente in:\n{file_path}")
        except Exception as e:
            messagebox.showerror("Errore", f"Impossibile salvare il file:\n{e}")


# Initialize main Tkinter window
root = tk.Tk()
root.title("Generatore XML Fatture Estere - Profis (TD17)")
root.geometry("450x520")
root.resizable(False, False)

# Section 1: Foreign Supplier Data
tk.Label(root, text="DATI FORNITORE ESTERO", font=("Arial", 10, "bold")).pack(pady=5)


def create_field(label_text, default_val=""):
    """Helper to create a label and input entry row."""
    frame = tk.Frame(root)
    frame.pack(fill="x", padx=12, pady=2)
    tk.Label(frame, text=label_text, width=18, anchor="w").pack(side="left")
    entry = tk.Entry(frame, width=30)
    entry.pack(side="right", expand=True, fill="x")
    entry.insert(0, default_val)
    return entry


entry_supp_name = create_field("Nome Fornitore:", "FORNITORE ESTERO ESEMPIO S.A.")
entry_supp_vat = create_field("P.IVA / Cod. Estero:", "SK9999999999")
entry_supp_country = create_field("Nazione (es. SK):", "SK")
entry_supp_cap = create_field("CAP (5 cifre):", "83104")
entry_supp_city = create_field("Città:", "Bratislava")
entry_supp_addr = create_field("Indirizzo:", "Via Esempio Estero 10")

# Section 2: Invoice Data
tk.Label(root, text="DATI FATTURA", font=("Arial", 10, "bold")).pack(pady=(10, 5))

entry_inv_num = create_field("Numero Fattura:", "2026120107")
entry_inv_date = create_field("Data (AAAA-MM-GG):", "2026-07-08")
entry_inv_amount = create_field("Importo Imponibile:", "600.00")
entry_inv_desc = create_field("Descrizione / Causale:", "Storage of ATEX Technical documentation")

# Primary Action Button
btn_generate = tk.Button(
    root,
    text="GENERA E SALVA XML",
    bg="#16a34a",
    fg="white",
    font=("Arial", 11, "bold"),
    cursor="hand2",
    command=generate_xml
)
btn_generate.pack(pady=15, padx=12, fill="x")

if __name__ == "__main__":
    root.mainloop()
