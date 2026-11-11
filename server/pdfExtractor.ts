import { createRequire } from 'module';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PDFPageData } from './types.js';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

export interface ExtractionResult {
  pages: PDFPageData[];
  totalWords: number;
  totalChars: number;
  isScanned: boolean;
  scanWarning?: string;
}

/**
 * Extracts text from a PDF buffer page by page, strictly preserving 1-based page numbers.
 */
export async function extractPDFPages(buffer: Buffer): Promise<ExtractionResult> {
  // Validate PDF header magic bytes "%PDF-"
  if (buffer.length < 5 || buffer.toString('utf-8', 0, 5) !== '%PDF-') {
    throw new Error('Invalid file format: File does not have a valid PDF header (%PDF-).');
  }

  let parser: any;
  try {
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const rawPages: Array<{ text: string; num: number }> = result.pages || [];

    const pages: PDFPageData[] = [];
    let totalChars = 0;
    let totalWords = 0;

    for (let i = 0; i < rawPages.length; i++) {
      const pageNum = rawPages[i].num || (i + 1);
      const cleanText = (rawPages[i].text || '')
        .replace(/\r\n/g, '\n')
        .replace(/\t/g, ' ')
        .trim();

      const words = cleanText.split(/\s+/).filter(Boolean).length;
      totalWords += words;
      totalChars += cleanText.length;

      pages.push({
        pageNumber: pageNum,
        text: cleanText,
        charCount: cleanText.length,
      });
    }

    // Sort by page number to guarantee 1-based order
    pages.sort((a, b) => a.pageNumber - b.pageNumber);

    // Scanned or image-only detection:
    // If average characters per page is under 15 characters, it's virtually empty or raster image
    const isScanned = pages.length > 0 && (totalChars / pages.length < 25);
    let scanWarning: string | undefined;

    if (isScanned) {
      scanWarning =
        'This PDF appears to be scanned or image-only with negligible text layer. Optical Character Recognition (OCR) is required to transcribe pixel-based PDFs. Please upload a searchable digital PDF or export text.';
    }

    return {
      pages,
      totalWords,
      totalChars,
      isScanned,
      scanWarning,
    };
  } finally {
    if (parser && typeof parser.destroy === 'function') {
      try {
        await parser.destroy();
      } catch (e) {
        // Ignore destroy error
      }
    }
  }
}

/**
 * Generates an authentic 3-page sample PDF whitepaper with clear factual content
 * across pages for instant testing of RAG retrieval and exact page citations.
 */
export async function createSamplePDFBuffer(): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Page 1: Solar & Wind Grid Parity
  const page1 = doc.addPage([612, 792]);
  page1.drawText('Global Clean Energy Transition Report 2026', {
    x: 50,
    y: 730,
    size: 20,
    font: fontBold,
    color: rgb(0.06, 0.15, 0.35),
  });
  page1.drawText('Chapter 1: Solar and Wind Grid Parity Economics', {
    x: 50,
    y: 695,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.25, 0.5),
  });

  const page1Lines = [
    'In 2024, utility-scale solar photovoltaics (PV) and onshore wind power officially reached',
    'global unsubsidized grid parity across 85% of global power markets. The Levelized Cost of',
    'Electricity (LCOE) for utility-scale solar dropped to $32 per megawatt-hour (MWh), compared',
    'to $48 per MWh for natural gas combined-cycle plants.',
    '',
    'Onshore wind achieved an average LCOE of $34 per MWh, driven by taller 160-meter turbine hub',
    'heights and larger rotor diameters exceeding 175 meters in capacity factor.',
    '',
    'Key Economic Milestones in 2024:',
    '• Solar PV installed capacity exceeded 2,100 Gigawatts globally.',
    '• Capital expenditure for solar modules fell to 11 cents per watt.',
    '• Annual additions of renewable electricity generation reached 510 Gigawatts.',
    '• Bifacial solar panel adoption exceeded 70% in utility projects due to 12% higher albedo yield.',
    '',
    'Document Reference: Department of Renewable Economics, Publication ID: GRE-2026-V1, Page 1.',
  ];

  let y1 = 660;
  for (const line of page1Lines) {
    if (line.startsWith('•') || line.startsWith('Key Economic')) {
      page1.drawText(line, { x: 50, y: y1, size: 11, font: fontBold, color: rgb(0.12, 0.12, 0.12) });
    } else {
      page1.drawText(line, { x: 50, y: y1, size: 11, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    }
    y1 -= 22;
  }
  page1.drawText('Page 1 of 3 — Renewable Energy Whitepaper', {
    x: 200,
    y: 40,
    size: 9,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Page 2: Battery Energy Storage Systems (BESS)
  const page2 = doc.addPage([612, 792]);
  page2.drawText('Global Clean Energy Transition Report 2026', {
    x: 50,
    y: 730,
    size: 20,
    font: fontBold,
    color: rgb(0.06, 0.15, 0.35),
  });
  page2.drawText('Chapter 2: Grid-Scale Energy Storage and Battery Chemistry', {
    x: 50,
    y: 695,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.25, 0.5),
  });

  const page2Lines = [
    'Grid-scale battery energy storage systems (BESS) represent the essential balancing mechanism',
    'for intermittent renewable resources. In 2025, Lithium Iron Phosphate (LFP) emerged as the',
    'dominant utility chemistry, capturing 88% of all new battery installations worldwide.',
    '',
    'LFP chemistry provides a critical thermal runaway safety advantage and boasts an operating life',
    'exceeding 8,000 charge-discharge cycles at 80% depth-of-discharge (DoD).',
    '',
    'Battery Technical Specifications & Grid Performance:',
    '• Standard utility storage duration reached 4 hours with 92% round-trip AC-to-AC efficiency.',
    '• Pack-level battery pricing reached $82 per kilowatt-hour (kWh) in late 2025.',
    '• Grid-forming inverters (GFIs) provide synthetic inertia to replace retiring synchronous condensers.',
    '• Flow batteries utilizing iron-electrolyte demonstrated 12-hour multi-day discharge capability.',
    '',
    'Storage deployment grew by 125% year-over-year, preventing curtailment in Texas and California grids.',
    'Document Reference: Department of Renewable Economics, Publication ID: GRE-2026-V1, Page 2.',
  ];

  let y2 = 660;
  for (const line of page2Lines) {
    if (line.startsWith('•') || line.startsWith('Battery Technical')) {
      page2.drawText(line, { x: 50, y: y2, size: 11, font: fontBold, color: rgb(0.12, 0.12, 0.12) });
    } else {
      page2.drawText(line, { x: 50, y: y2, size: 11, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    }
    y2 -= 22;
  }
  page2.drawText('Page 2 of 3 — Renewable Energy Whitepaper', {
    x: 200,
    y: 40,
    size: 9,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Page 3: Policy, Mandates, and 2030 Targets
  const page3 = doc.addPage([612, 792]);
  page3.drawText('Global Clean Energy Transition Report 2026', {
    x: 50,
    y: 730,
    size: 20,
    font: fontBold,
    color: rgb(0.06, 0.15, 0.35),
  });
  page3.drawText('Chapter 3: Regulatory Frameworks and 2030 Zero-Carbon Mandates', {
    x: 50,
    y: 695,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.25, 0.5),
  });

  const page3Lines = [
    'The 2030 Clean Energy Mandate establishes binding national targets for grid decarbonization.',
    'Under this framework, participating nations must generate at least 80% of all retail electricity',
    'from zero-carbon resources by December 31, 2030, with full net-zero power by 2035.',
    '',
    'Interconnection queue reform requires transmission operators to complete cluster studies within',
    '150 calendar days, eliminating previous multi-year interconnection delays.',
    '',
    'Mandate Enforcement and Financial Mechanisms:',
    '• Clean Energy Production Tax Credit (PTC) provides $27.50 per MWh inflation-adjusted credit.',
    '• Carbon border adjustment taxes apply to non-compliant heavy industrial energy imports.',
    '• Transmission Super-Highway Initiative allocated $45 billion for high-voltage direct current (HVDC) lines.',
    '• Penalties of $120 per MWh apply to non-compliant retail energy utilities failing 2030 quotas.',
    '',
    'Conclusion: Reaching the 80% zero-carbon milestone requires 1,200 GW of additional regional transmission lines.',
    'Document Reference: Department of Renewable Economics, Publication ID: GRE-2026-V1, Page 3.',
  ];

  let y3 = 660;
  for (const line of page3Lines) {
    if (line.startsWith('•') || line.startsWith('Mandate Enforcement')) {
      page3.drawText(line, { x: 50, y: y3, size: 11, font: fontBold, color: rgb(0.12, 0.12, 0.12) });
    } else {
      page3.drawText(line, { x: 50, y: y3, size: 11, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    }
    y3 -= 22;
  }
  page3.drawText('Page 3 of 3 — Renewable Energy Whitepaper', {
    x: 200,
    y: 40,
    size: 9,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
