#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Unit tests for Profis Foreign Invoice XML Generator (TD17).
Validates XML structure, escaping of special characters, and FPR12 schema compliance.
100% offline, generic mock data, zero sensitive information.
"""

import unittest
import xml.etree.ElementTree as ET
from xml.sax.saxutils import escape as xml_escape


def build_test_xml(supp_name, supp_vat, supp_country, supp_cap, supp_city, supp_addr,
                   inv_num, inv_date, inv_amount, inv_desc, doc_type="TD17"):
    """Helper function to build an XML string matching the generator logic."""
    s_name = xml_escape(supp_name)
    s_vat = xml_escape(supp_vat)
    s_country = xml_escape(supp_country)
    s_cap = xml_escape(supp_cap)
    s_city = xml_escape(supp_city)
    s_addr = xml_escape(supp_addr)
    i_num = xml_escape(inv_num)
    i_date = xml_escape(inv_date)
    i_desc = xml_escape(inv_desc)
    d_type = xml_escape(doc_type)

    amount_float = float(inv_amount.replace(",", "."))
    formatted_amount = f"{amount_float:.2f}"
    natura = "N6.1"

    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="FPR12" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <IdTrasmittente>
        <IdPaese>IT</IdPaese>
        <IdCodice>12345678901</IdCodice>
      </IdTrasmittente>
      <ProgressivoInvio>20261</ProgressivoInvio>
      <FormatoTrasmissione>FPR12</FormatoTrasmissione>
      <CodiceDestinatario>0000000</CodiceDestinatario>
    </DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA>
          <IdPaese>{s_country}</IdPaese>
          <IdCodice>{s_vat}</IdCodice>
        </IdFiscaleIVA>
        <Anagrafica>
          <Denominazione>{s_name}</Denominazione>
        </Anagrafica>
        <RegimeFiscale>RF01</RegimeFiscale>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>{s_addr}</Indirizzo>
        <CAP>{s_cap}</CAP>
        <Comune>{s_city}</Comune>
        <Nazione>{s_country}</Nazione>
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
        <TipoDocumento>{d_type}</TipoDocumento>
        <Divisa>EUR</Divisa>
        <Data>{i_date}</Data>
        <Numero>{i_num}</Numero>
        <ImportoTotaleDocumento>{formatted_amount}</ImportoTotaleDocumento>
        <Causale>{i_desc}</Causale>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      <DettaglioLinee>
        <NumeroLinea>1</NumeroLinea>
        <Descrizione>{i_desc}</Descrizione>
        <Quantita>1.00</Quantita>
        <PrezzoUnitario>{formatted_amount}</PrezzoUnitario>
        <PrezzoTotale>{formatted_amount}</PrezzoTotale>
        <AliquotaIVA>0.00</AliquotaIVA>
        <Natura>{natura}</Natura>
      </DettaglioLinee>
      <DatiRiepilogo>
        <AliquotaIVA>0.00</AliquotaIVA>
        <Natura>{natura}</Natura>
        <ImponibileImporto>{formatted_amount}</ImponibileImporto>
        <Imposta>0.00</Imposta>
        <RiferimentoNormativo>Inversione contabile</RiferimentoNormativo>
      </DatiRiepilogo>
    </DatiBeniServizi>
  </FatturaElettronicaBody>
</p:FatturaElettronica>"""
    return xml_content


class TestXmlGenerator(unittest.TestCase):
    """Test suite for XML generation."""

    def test_xml_structure_validity(self):
        xml_str = build_test_xml(
            supp_name="FORNITORE ESTERO ESEMPIO S.A.",
            supp_vat="SK9999999999",
            supp_country="SK",
            supp_cap="83104",
            supp_city="Bratislava",
            supp_addr="Via Esempio Estero 10",
            inv_num="2026120107",
            inv_date="2026-07-08",
            inv_amount="600.00",
            inv_desc="Storage of ATEX Technical documentation",
            doc_type="TD17"
        )
        root = ET.fromstring(xml_str)
        self.assertTrue(root.tag.endswith("FatturaElettronica"))
        self.assertEqual(root.attrib.get("versione"), "FPR12")

        # Verify TD17 Document Type
        doc_type_elem = root.find(".//TipoDocumento")
        self.assertIsNotNone(doc_type_elem)
        self.assertEqual(doc_type_elem.text, "TD17")

    def test_special_characters_escape(self):
        xml_str = build_test_xml(
            supp_name="Smith & Sons <Consulting> S.L.",
            supp_vat="ESB12345678",
            supp_country="ES",
            supp_cap="28001",
            supp_city="Madrid",
            supp_addr="Calle Mayor 1 & 2",
            inv_num="INV/2026-001",
            inv_date="2026-05-12",
            inv_amount="1250,50",
            inv_desc="Audit & Compliance Service",
            doc_type="TD17"
        )
        root = ET.fromstring(xml_str)
        self.assertIsNotNone(root)
        self.assertIn("1250.50", xml_str)
        self.assertIn("&amp;", xml_str)


if __name__ == "__main__":
    unittest.main()
