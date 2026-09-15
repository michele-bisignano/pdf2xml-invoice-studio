import { FullInvoiceState } from "../types";

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
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(",", "."));
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
}

export function generateInvoiceXml(state: FullInvoiceState): string {
  const { supplier, customer, invoice } = state;

  const formattedAmount = formatAmount(invoice.amount);
  const now = new Date();
  const progressivo = now.toISOString().replace(/[-:T.Z]/g, "").slice(-5);

  // Clean country code and VAT
  const suppCountry = (supplier.country || "XX").trim().toUpperCase();
  let suppVat = (supplier.vat || "").trim();
  if (suppVat.toUpperCase().startsWith(suppCountry) && suppCountry.length === 2) {
    suppVat = suppVat.substring(2);
  }

  const custCountry = (customer.country || "IT").trim().toUpperCase();
  let custVat = (customer.vat || "").trim();
  if (custVat.toUpperCase().startsWith(custCountry) && custCountry.length === 2) {
    custVat = custVat.substring(2);
  }

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
          <Denominazione>${escapeXml(supplier.name)}</Denominazione>
        </Anagrafica>
        <RegimeFiscale>RF01</RegimeFiscale>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${escapeXml(supplier.address)}</Indirizzo>
        <CAP>${escapeXml(supplier.cap)}</CAP>
        <Comune>${escapeXml(supplier.city)}</Comune>
        <Nazione>${escapeXml(suppCountry)}</Nazione>
      </Sede>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        <IdFiscaleIVA>
          <IdPaese>${escapeXml(custCountry)}</IdPaese>
          <IdCodice>${escapeXml(custVat)}</IdCodice>
        </IdFiscaleIVA>
        ${customer.fiscalCode ? `<CodiceFiscale>${escapeXml(customer.fiscalCode)}</CodiceFiscale>` : ""}
        <Anagrafica>
          <Denominazione>${escapeXml(customer.name)}</Denominazione>
        </Anagrafica>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${escapeXml(customer.address)}</Indirizzo>
        <CAP>${escapeXml(customer.cap)}</CAP>
        <Comune>${escapeXml(customer.city)}</Comune>
        ${customer.province ? `<Provincia>${escapeXml(customer.province)}</Provincia>` : ""}
        <Nazione>${escapeXml(custCountry)}</Nazione>
      </Sede>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>${escapeXml(invoice.documentType)}</TipoDocumento>
        <Divisa>${escapeXml(invoice.currency || "EUR")}</Divisa>
        <Data>${escapeXml(invoice.invoiceDate)}</Data>
        <Numero>${escapeXml(invoice.invoiceNumber)}</Numero>
        <ImportoTotaleDocumento>${formattedAmount}</ImportoTotaleDocumento>
        <Causale>${escapeXml(invoice.description)}</Causale>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      <DettaglioLinee>
        <NumeroLinea>1</NumeroLinea>
        <Descrizione>${escapeXml(invoice.description)}</Descrizione>
        <Quantita>1.00</Quantita>
        <PrezzoUnitario>${formattedAmount}</PrezzoUnitario>
        <PrezzoTotale>${formattedAmount}</PrezzoTotale>
        <AliquotaIVA>${escapeXml(invoice.vatRate || "0.00")}</AliquotaIVA>
        ${invoice.vatNature ? `<Natura>${escapeXml(invoice.vatNature)}</Natura>` : ""}
      </DettaglioLinee>
      <DatiRiepilogo>
        <AliquotaIVA>${escapeXml(invoice.vatRate || "0.00")}</AliquotaIVA>
        ${invoice.vatNature ? `<Natura>${escapeXml(invoice.vatNature)}</Natura>` : ""}
        <ImponibileImporto>${formattedAmount}</ImponibileImporto>
        <Imposta>0.00</Imposta>
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
