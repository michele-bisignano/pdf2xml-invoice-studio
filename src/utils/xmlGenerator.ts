import { FullInvoiceState } from "../types";
import { normalizeCountryCode, normalizeDateForXml } from "./validation";

export function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function formatAmount(val: string | number): string {
  if (typeof val === "number") return isNaN(val) ? "0.00" : val.toFixed(2);
  let clean = String(val || "").trim().replace(/[€$£a-zA-Z\s]/g, "");
  if (clean.includes(".") && clean.includes(",")) {
    if (clean.lastIndexOf(",") > clean.lastIndexOf(".")) {
      clean = clean.replace(/\./g, "").replace(",", ".");
    } else {
      clean = clean.replace(/,/g, "");
    }
  } else if (clean.includes(",")) {
    clean = clean.replace(",", ".");
  }
  const num = parseFloat(clean);
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
}

export function generateInvoiceXml(state: FullInvoiceState): string {
  const { supplier, customer, invoice } = state;

  const formattedAmount = formatAmount(invoice.amount);
  const numAmount = parseFloat(formattedAmount);
  const vatRateNum = parseFloat(invoice.vatRate || "0");
  const imposta = vatRateNum > 0 ? ((numAmount * vatRateNum) / 100).toFixed(2) : "0.00";
  const formattedVatRate = vatRateNum > 0 ? vatRateNum.toFixed(2) : "0.00";
  // In SDI: <Natura> is MANDATORY if AliquotaIVA is 0.00, and FORBIDDEN if AliquotaIVA > 0 (error 00420)
  const naturaTag = vatRateNum === 0 && invoice.vatNature ? `<Natura>${escapeXml(invoice.vatNature)}</Natura>` : "";

  const now = new Date();
  const progressivo = now.toISOString().replace(/[-:T.Z]/g, "").slice(-5);

  // Clean country code and VAT (SDI allows alphanumeric only, max 28 chars)
  const suppCountry = normalizeCountryCode(supplier.country || "XX");
  let suppVat = (supplier.vat || "").trim().replace(/[\s.-]/g, "");
  if (suppVat.toUpperCase().startsWith(suppCountry) && suppCountry.length === 2) {
    suppVat = suppVat.substring(2);
  }

  const custCountry = normalizeCountryCode(customer.country || "IT");
  let custVat = (customer.vat || "").trim().replace(/[\s.-]/g, "");
  if (custVat.toUpperCase().startsWith(custCountry) && custCountry.length === 2) {
    custVat = custVat.substring(2);
  }
  const custFiscalCode = (customer.fiscalCode || "").trim().replace(/[\s.-]/g, "").toUpperCase();

  const formattedInvoiceDate = normalizeDateForXml(invoice.invoiceDate);

  return `<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="FPR12" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <IdTrasmittente>
        <IdPaese>${escapeXml(custCountry)}</IdPaese>
        <IdCodice>${escapeXml(custVat)}</IdCodice>
      </IdTrasmittente>
      <ProgressivoInvio>${progressivo}</ProgressivoInvio>
      <FormatoTrasmissione>FPR12</FormatoTrasmissione>
      <CodiceDestinatario>0000000</CodiceDestinatario>
    </DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA>
          <IdPaese>${escapeXml(suppCountry)}</IdPaese>
          <IdCodice>${escapeXml(suppVat)}</IdCodice>
        </IdFiscaleIVA>
        <Anagrafica>
          <Denominazione>${escapeXml(supplier.name || "FORNITORE ESTERO")}</Denominazione>
        </Anagrafica>
        <RegimeFiscale>RF01</RegimeFiscale>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${escapeXml(supplier.address || "ND")}</Indirizzo>
        <CAP>${escapeXml(supplier.cap || (suppCountry === "IT" ? "00000" : "99999"))}</CAP>
        <Comune>${escapeXml(supplier.city || "ND")}</Comune>
        <Nazione>${escapeXml(suppCountry)}</Nazione>
      </Sede>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        <IdFiscaleIVA>
          <IdPaese>${escapeXml(custCountry)}</IdPaese>
          <IdCodice>${escapeXml(custVat)}</IdCodice>
        </IdFiscaleIVA>
        ${custFiscalCode ? `<CodiceFiscale>${escapeXml(custFiscalCode)}</CodiceFiscale>` : ""}
        <Anagrafica>
          <Denominazione>${escapeXml(customer.name || "COMMITTENTE")}</Denominazione>
        </Anagrafica>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${escapeXml(customer.address || "ND")}</Indirizzo>
        <CAP>${escapeXml(customer.cap || "00100")}</CAP>
        <Comune>${escapeXml(customer.city || "ROMA")}</Comune>
        ${customer.province ? `<Provincia>${escapeXml(customer.province.trim().toUpperCase())}</Provincia>` : ""}
        <Nazione>${escapeXml(custCountry)}</Nazione>
      </Sede>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>${escapeXml(invoice.documentType)}</TipoDocumento>
        <Divisa>${escapeXml(invoice.currency || "EUR")}</Divisa>
        <Data>${escapeXml(formattedInvoiceDate)}</Data>
        <Numero>${escapeXml(invoice.invoiceNumber)}</Numero>
        <ImportoTotaleDocumento>${formattedAmount}</ImportoTotaleDocumento>
        <Causale>${escapeXml(invoice.description || "Inversione contabile - autofattura")}</Causale>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      <DettaglioLinee>
        <NumeroLinea>1</NumeroLinea>
        <Descrizione>${escapeXml(invoice.description || "Prestazione di servizi / cessione beni")}</Descrizione>
        <Quantita>1.00</Quantita>
        <PrezzoUnitario>${formattedAmount}</PrezzoUnitario>
        <PrezzoTotale>${formattedAmount}</PrezzoTotale>
        <AliquotaIVA>${formattedVatRate}</AliquotaIVA>
        ${naturaTag}
      </DettaglioLinee>
      <DatiRiepilogo>
        <AliquotaIVA>${formattedVatRate}</AliquotaIVA>
        ${naturaTag}
        <ImponibileImporto>${formattedAmount}</ImponibileImporto>
        <Imposta>${imposta}</Imposta>
        ${invoice.normativeReference ? `<RiferimentoNormativo>${escapeXml(invoice.normativeReference)}</RiferimentoNormativo>` : ""}
      </DatiRiepilogo>
    </DatiBeniServizi>
  </FatturaElettronicaBody>
</p:FatturaElettronica>`;
}

export function generateFilename(state: FullInvoiceState, inputFileName?: string): string {
  if (inputFileName && inputFileName.trim()) {
    // Preserve the original uploaded file name (PDF or image) with .xml extension
    const cleanBaseName = inputFileName.trim().replace(/\.[^/.]+$/, "");
    if (cleanBaseName) {
      return `${cleanBaseName}.xml`;
    }
  }
  const custVat = (state.customer.vat || "12345678901").replace(/[^a-zA-Z0-9]/g, "");
  const invNum = (state.invoice.invoiceNumber || "001").replace(/[^a-zA-Z0-9]/g, "_");
  return `IT${custVat}_${invNum}.xml`;
}
