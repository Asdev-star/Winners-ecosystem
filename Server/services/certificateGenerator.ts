import crypto from "crypto";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export interface CertificateIdentifiers {
  certNumber: string;
  verificationCode: string;
}

export interface CertificatePdfInput {
  userName: string;
  courseTitle: string;
  issuedAt: Date;
  certNumber: string;
  verificationCode: string;
  verifyUrl: string;
  courseDescription?: string | null;
}

function getPublicBaseUrl() {
  const appUrl = process.env.APP_URL?.trim() || process.env.PUBLIC_APP_URL?.trim();
  if (appUrl) return appUrl.replace(/\/+$/, "");
  return "https://winnersempire.io";
}

export function createCertificateIdentifiers(): CertificateIdentifiers {
  const certSuffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  const verificationCode = crypto.randomBytes(12).toString("hex").toUpperCase();
  return {
    certNumber: `CERT-${certSuffix}`,
    verificationCode,
  };
}

export function buildCertificateVerifyUrl(certNumber: string): string {
  return `${getPublicBaseUrl()}/verify/${encodeURIComponent(certNumber)}`;
}

export async function generateCertificatePdfBuffer(
  input: CertificatePdfInput,
): Promise<Buffer> {
  const qrDataUrl = await QRCode.toDataURL(input.verifyUrl, {
    margin: 1,
    width: 220,
    errorCorrectionLevel: "M",
  });

  const doc = new PDFDocument({
    layout: "landscape",
    size: "A4",
    margin: 0,
    info: {
      Title: `Certificate ${input.certNumber}`,
      Author: "Winners Ecosystem",
      Subject: input.courseTitle,
    },
  });

  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const width = doc.page.width;
    const height = doc.page.height;

    doc.rect(0, 0, width, height).fill("#08111C");
    doc.rect(24, 24, width - 48, height - 48).lineWidth(3).stroke("#C9A84C");
    doc.rect(36, 36, width - 72, height - 72).lineWidth(1).stroke("#89C4E1");

    doc.save();
    doc.opacity(0.12);
    doc.circle(width - 130, 110, 110).fill("#C9A84C");
    doc.circle(130, height - 120, 95).fill("#2DD5A0");
    doc.restore();

    doc
      .fillColor("#C9A84C")
      .font("Times-Bold")
      .fontSize(28)
      .text("CERTIFICATE OF COMPLETION", 0, 72, { align: "center" });

    doc
      .fillColor("#E8EEF5")
      .font("Times-Roman")
      .fontSize(13)
      .text("This certifies that", 0, 128, { align: "center" });

    doc
      .fillColor("#C9A84C")
      .font("Times-BoldItalic")
      .fontSize(34)
      .text(input.userName, 0, 160, { align: "center" });

    doc
      .fillColor("#E8EEF5")
      .font("Times-Roman")
      .fontSize(13)
      .text("has successfully completed", 0, 222, { align: "center" });

    doc
      .fillColor("#89C4E1")
      .font("Times-Bold")
      .fontSize(23)
      .text(input.courseTitle, 0, 250, { align: "center" });

    if (input.courseDescription) {
      doc
        .fillColor("#A9B8C7")
        .font("Times-Roman")
        .fontSize(11)
        .text(input.courseDescription, 110, 286, {
          align: "center",
          width: width - 220,
          lineGap: 3,
        });
    }

    const issuedLabel = input.issuedAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    doc
      .fillColor("#A9B8C7")
      .font("Times-Roman")
      .fontSize(11)
      .text(`Issued ${issuedLabel}`, 0, height - 104, { align: "center" });

    doc
      .font("Times-Roman")
      .fontSize(9)
      .fillColor("#A9B8C7")
      .text(`Certificate No: ${input.certNumber}`, 52, height - 60);

    doc
      .text(`Verification Code: ${input.verificationCode}`, 52, height - 44);

    doc
      .text(`Verify: ${input.verifyUrl}`, width - 300, height - 60, {
        width: 240,
        align: "right",
      });

    doc.image(qrDataUrl, width - 150, height - 184, {
      fit: [96, 96],
      align: "center",
      valign: "center",
    });

    doc
      .fillColor("#C9A84C")
      .font("Times-Bold")
      .fontSize(9)
      .text("WINNERS ECOSYSTEM", 0, height - 24, { align: "center" });

    doc.end();
  });
}
