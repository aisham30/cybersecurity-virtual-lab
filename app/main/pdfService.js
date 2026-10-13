'use strict';
/**
 * PDF Generation and Delivery Service.
 * Generates and exports high-definition educational PDFs using Electron's native printToPDF engine.
 */
const { BrowserWindow, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

class PdfService {
  constructor() {
    this.resourcesDir = path.resolve(__dirname, '../../resources');

    this.pdfConfig = {
      'concept-deep-dive': {
        filename: 'Flood_Attack_Concept_Deep_Dive.pdf',
        htmlFile: 'study-guide.html',
        fallbackExisting: 'Flood_Attack_In_Depth_Study_Guide.pdf',
        title: 'Flood Attack — Concept Deep Dive Notes'
      },
      'last-minute-revision': {
        filename: 'Flood_Attack_Last_Minute_Revision.pdf',
        htmlFile: 'last-minute-revision.html',
        title: 'Flood Attack — Last-Minute Revision'
      },
      'important-concepts': {
        filename: 'Flood_Attack_Important_Concepts.pdf',
        htmlFile: 'important-concepts.html',
        title: 'Flood Attack — Important Concepts'
      },
      'definitions-glossary': {
        filename: 'Flood_Attack_Definitions_Glossary.pdf',
        htmlFile: 'definitions-glossary.html',
        title: 'Flood Attack — Definitions and Glossary'
      },
      'diagrams-and-charts': {
        filename: 'Flood_Attack_Diagrams_and_Charts.pdf',
        htmlFile: 'visual-guide.html',
        fallbackExisting: 'Flood_Attack_Charts_and_Diagrams.pdf',
        title: 'Flood Attack — Diagrams, Charts & Visual Learning'
      },
      // Aliases
      'study-guide': {
        filename: 'Flood_Attack_Concept_Deep_Dive.pdf',
        htmlFile: 'study-guide.html',
        fallbackExisting: 'Flood_Attack_In_Depth_Study_Guide.pdf',
        title: 'Flood Attack — Concept Deep Dive Notes'
      },
      'visual-guide': {
        filename: 'Flood_Attack_Diagrams_and_Charts.pdf',
        htmlFile: 'visual-guide.html',
        fallbackExisting: 'Flood_Attack_Charts_and_Diagrams.pdf',
        title: 'Flood Attack — Diagrams, Charts & Visual Learning'
      }
    };
  }

  getPdfItem(type) {
    return this.pdfConfig[type] || this.pdfConfig['concept-deep-dive'];
  }

  async generatePdfFromHtml(htmlPath, outputPath) {
    const win = new BrowserWindow({
      show: false,
      width: 1200,
      height: 1600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    try {
      await win.loadFile(htmlPath);
      // Wait for DOM & SVG layouts to fully paint
      await new Promise((resolve) => setTimeout(resolve, 600));

      const pdfBuffer = await win.webContents.printToPDF({
        pageSize: 'A4',
        printBackground: true,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        preferCSSPageSize: true,
      });

      fs.writeFileSync(outputPath, pdfBuffer);
      return { success: true, path: outputPath, size: pdfBuffer.length };
    } catch (err) {
      console.error('[PdfService] Error generating PDF from HTML:', err);
      throw err;
    } finally {
      if (!win.isDestroyed()) win.close();
    }
  }

  async ensurePdfsGenerated() {
    try {
      if (!fs.existsSync(this.resourcesDir)) {
        fs.mkdirSync(this.resourcesDir, { recursive: true });
      }

      // Check and seed existing files if names match
      for (const [key, item] of Object.entries(this.pdfConfig)) {
        if (key === 'study-guide' || key === 'visual-guide') continue;
        const targetPdf = path.join(this.resourcesDir, item.filename);

        if (!fs.existsSync(targetPdf)) {
          if (item.fallbackExisting) {
            const fallbackPath = path.join(this.resourcesDir, item.fallbackExisting);
            if (fs.existsSync(fallbackPath)) {
              fs.copyFileSync(fallbackPath, targetPdf);
              console.log(`[PdfService] Initialized ${item.filename} from existing fallback.`);
              continue;
            }
          }

          const htmlPath = path.join(this.resourcesDir, item.htmlFile);
          if (fs.existsSync(htmlPath)) {
            await this.generatePdfFromHtml(htmlPath, targetPdf).catch((err) => {
              console.warn(`[PdfService] Generation deferred for ${item.filename}:`, err.message);
            });
          }
        }
      }
    } catch (err) {
      console.error('[PdfService] ensurePdfsGenerated error:', err);
    }
  }

  async exportPdf(type, parentWindow) {
    const item = this.getPdfItem(type);
    const srcPath = path.join(this.resourcesDir, item.filename);
    const defaultName = item.filename;

    try {
      if (!fs.existsSync(srcPath)) {
        if (item.fallbackExisting) {
          const fallbackPath = path.join(this.resourcesDir, item.fallbackExisting);
          if (fs.existsSync(fallbackPath)) {
            fs.copyFileSync(fallbackPath, srcPath);
          }
        }
        if (!fs.existsSync(srcPath)) {
          const htmlPath = path.join(this.resourcesDir, item.htmlFile);
          if (fs.existsSync(htmlPath)) {
            await this.generatePdfFromHtml(htmlPath, srcPath);
          }
        }
      }

      const { filePath } = await dialog.showSaveDialog(parentWindow, {
        title: `Save ${defaultName}`,
        defaultPath: defaultName,
        filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
      });

      if (filePath && fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, filePath);
        return { success: true, path: filePath };
      }
      return { success: false, cancelled: !filePath };
    } catch (err) {
      console.error('[PdfService] exportPdf error:', err);
      return { success: false, error: err.message };
    }
  }

  async openPdf(type) {
    const item = this.getPdfItem(type);
    const srcPath = path.join(this.resourcesDir, item.filename);

    try {
      if (!fs.existsSync(srcPath)) {
        if (item.fallbackExisting) {
          const fallbackPath = path.join(this.resourcesDir, item.fallbackExisting);
          if (fs.existsSync(fallbackPath)) {
            fs.copyFileSync(fallbackPath, srcPath);
          }
        }
        if (!fs.existsSync(srcPath)) {
          const htmlPath = path.join(this.resourcesDir, item.htmlFile);
          if (fs.existsSync(htmlPath)) {
            await this.generatePdfFromHtml(htmlPath, srcPath);
          }
        }
      }

      if (fs.existsSync(srcPath)) {
        await shell.openPath(srcPath);
        return { success: true, path: srcPath };
      }
      return { success: false, error: 'File not found' };
    } catch (err) {
      console.error('[PdfService] openPdf error:', err);
      return { success: false, error: err.message };
    }
  }
}

module.exports = { PdfService };
