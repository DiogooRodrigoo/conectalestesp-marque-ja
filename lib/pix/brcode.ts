// Gerador de BR Code PIX — padrão Banco Central do Brasil (EMV QR Code)
// Sem dependência de gateway externo. Funciona com qualquer chave PIX válida.

import QRCode from "qrcode";

function field(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function sanitize(str: string, maxLen: number): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .trim()
    .slice(0, maxLen);
}

export interface PixBRCodeParams {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amountCents: number;
  txid?: string;
}

export function generatePixBRCode({
  pixKey,
  merchantName,
  merchantCity,
  amountCents,
  txid,
}: PixBRCodeParams): string {
  const amount = (amountCents / 100).toFixed(2);

  // Campo 26 — Merchant Account Info (PIX)
  const gui = field("00", "br.gov.bcb.pix");
  const key = field("01", pixKey);
  const merchantAccount = field("26", gui + key);

  // Campo 62 — Additional Data (txid: apenas alfanumérico, max 25)
  const txidClean = (txid ?? "***")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 25) || "***";
  const additionalData = field("62", field("05", txidClean));

  const payload =
    field("00", "01") +         // Payload Format Indicator
    merchantAccount +            // Merchant Account Information (PIX)
    field("52", "0000") +        // Merchant Category Code
    field("53", "986") +         // Transaction Currency (BRL)
    field("54", amount) +        // Transaction Amount
    field("58", "BR") +          // Country Code
    field("59", sanitize(merchantName, 25)) +
    field("60", sanitize(merchantCity, 15)) +
    additionalData +
    "6304";                      // CRC placeholder

  return payload + crc16(payload);
}

export async function generatePixQRCodeBase64(brCode: string): Promise<string> {
  const dataUrl = await QRCode.toDataURL(brCode, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 400,
    color: { dark: "#000000", light: "#ffffff" },
  });
  // Retorna só o base64 sem o prefixo data:image/png;base64,
  return dataUrl.split(",")[1];
}
