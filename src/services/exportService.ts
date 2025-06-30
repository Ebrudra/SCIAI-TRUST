import jsPDF from 'jspdf';
import { Summary, Paper, ExportOptions } from '../types';

export class ExportService {
  static async exportSummary(
    summary: Summary, 
    paper: Paper, 
    options: ExportOptions
  ): Promise<void> {
    try {
      switch (options.format) {
        case 'pdf':
          await this.exportToPDF(summary, paper, options);
          break;
        case 'docx':
          await this.exportToDocx(summary, paper, options);
          break;
        case 'markdown':
          await this.exportToMarkdown(summary, paper, options);
          break;
        case 'json':
          await this.exportToJSON(summary, paper, options);
          break;
        case 'csv':
          await this.exportToCSV(summary, paper, options);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      throw new Error(`Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async exportToPDF(
    summary: Summary, 
    paper: Paper, 
    options: ExportOptions
  ): Promise<void> {
    const pdf = new jsPDF();
    let yPosition = 20;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;

    // Helper function to add text with word wrapping
    const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(fontSize);
      if (isBold) {
        pdf.setFont(undefined, 'bold');
      } else {
        pdf.setFont(undefined, 'normal');
      }

      const lines = pdf.splitTextToSize(text, pdf.internal.pageSize.width - 2 * margin);
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
      yPosition += 3; // Extra spacing after paragraphs
    };

    // Title
    addText(`Research Analysis Report`, 18, true);
    yPosition += 5;

    // Paper metadata
    if (options.sections.metadata) {
      addText(`Paper Title: ${paper.title}`, 14, true);
      addText(`Authors: ${paper.authors.join(', ')}`);
      if (paper.doi) addText(`DOI: ${paper.doi}`);
      if (paper.metadata?.journal) addText(`Journal: ${paper.metadata.journal}`);
      if (paper.metadata?.publishedDate) addText(`Published: ${paper.metadata.publishedDate}`);
      yPosition += 10;
    }

    // Summary
    if (options.sections.summary) {
      addText('Summary', 16, true);
      addText(summary.content);
      yPosition += 5;
    }

    // Key Points
    if (options.sections.keyPoints && summary.keyPoints.length > 0) {
      addText('Key Points', 16, true);
      summary.keyPoints.forEach((point, index) => {
        addText(`${index + 1}. ${point.content}`);
        addText(`   Importance: ${point.importance} | Confidence: ${Math.round(point.confidence * 100)}%`, 10);
      });
      yPosition += 5;
    }

    // Limitations
    if (options.sections.limitations && summary.limitations.length > 0) {
      addText('Limitations', 16, true);
      summary.limitations.forEach((limitation, index) => {
        addText(`${index + 1}. ${limitation}`);
      });
      yPosition += 5;
    }

    // Citations
    if (options.sections.citations && summary.citations.length > 0) {
      addText('Citations', 16, true);
      summary.citations.forEach((citation, index) => {
        addText(`${index + 1}. "${citation.text}"`);
        addText(`   Source: ${citation.sourceLocation} | Confidence: ${Math.round(citation.confidence * 100)}%`, 10);
      });
      yPosition += 5;
    }

    // Ethics Analysis
    if (options.sections.ethicsAnalysis && summary.ethicsFlags.length > 0) {
      addText('Ethics Analysis', 16, true);
      summary.ethicsFlags.forEach((flag, index) => {
        addText(`${index + 1}. ${flag.type.toUpperCase()} (${flag.severity})`, 12, true);
        addText(`Description: ${flag.description}`);
        addText(`Recommendation: ${flag.recommendation}`);
        if (flag.sourceLocation) addText(`Location: ${flag.sourceLocation}`, 10);
      });
      yPosition += 5;
    }

    // XAI Data
    if (options.sections.xaiData && summary.xaiData) {
      addText('Explainable AI Analysis', 16, true);
      addText(`Overall Confidence: ${Math.round(summary.xaiData.confidenceBreakdown.overall * 100)}%`);
      
      if (summary.xaiData.decisionPathways.length > 0) {
        addText('Decision Pathways:', 14, true);
        summary.xaiData.decisionPathways.forEach((pathway, index) => {
          addText(`${index + 1}. ${pathway.step}`);
          addText(`   Reasoning: ${pathway.reasoning}`);
          addText(`   Confidence: ${Math.round(pathway.confidence * 100)}%`, 10);
        });
      }
    }

    // Watermark
    if (options.includeWatermark) {
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text('Generated by SciAI Trust Toolkit', margin, pageHeight - 10);
        pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pdf.internal.pageSize.width - margin - 50, pageHeight - 10);
      }
    }

    // Download
    const filename = `analysis-${paper.title.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    pdf.save(filename);
  }

  private static async exportToMarkdown(
    summary: Summary, 
    paper: Paper, 
    options: ExportOptions
  ): Promise<void> {
    let markdown = '';

    // Title
    markdown += `# Research Analysis Report\n\n`;

    // Paper metadata
    if (options.sections.metadata) {
      markdown += `## Paper Information\n\n`;
      markdown += `**Title:** ${paper.title}\n\n`;
      markdown += `**Authors:** ${paper.authors.join(', ')}\n\n`;
      if (paper.doi) markdown += `**DOI:** ${paper.doi}\n\n`;
      if (paper.metadata?.journal) markdown += `**Journal:** ${paper.metadata.journal}\n\n`;
      if (paper.metadata?.publishedDate) markdown += `**Published:** ${paper.metadata.publishedDate}\n\n`;
    }

    // Summary
    if (options.sections.summary) {
      markdown += `## Summary\n\n`;
      markdown += `${summary.content}\n\n`;
    }

    // Key Points
    if (options.sections.keyPoints && summary.keyPoints.length > 0) {
      markdown += `## Key Points\n\n`;
      summary.keyPoints.forEach((point, index) => {
        markdown += `${index + 1}. **${point.content}**\n`;
        markdown += `   - Importance: ${point.importance}\n`;
        markdown += `   - Source: ${point.sourceSection}\n`;
        markdown += `   - Confidence: ${Math.round(point.confidence * 100)}%\n\n`;
      });
    }

    // Limitations
    if (options.sections.limitations && summary.limitations.length > 0) {
      markdown += `## Limitations\n\n`;
      summary.limitations.forEach((limitation, index) => {
        markdown += `${index + 1}. ${limitation}\n`;
      });
      markdown += '\n';
    }

    // Citations
    if (options.sections.citations && summary.citations.length > 0) {
      markdown += `## Citations\n\n`;
      summary.citations.forEach((citation, index) => {
        markdown += `${index + 1}. > "${citation.text}"\n`;
        markdown += `   - Source: ${citation.sourceLocation}\n`;
        markdown += `   - Confidence: ${Math.round(citation.confidence * 100)}%\n\n`;
      });
    }

    // Ethics Analysis
    if (options.sections.ethicsAnalysis && summary.ethicsFlags.length > 0) {
      markdown += `## Ethics Analysis\n\n`;
      summary.ethicsFlags.forEach((flag, index) => {
        markdown += `### ${index + 1}. ${flag.type.toUpperCase()} (${flag.severity} severity)\n\n`;
        markdown += `**Description:** ${flag.description}\n\n`;
        markdown += `**Recommendation:** ${flag.recommendation}\n\n`;
        if (flag.sourceLocation) markdown += `**Location:** ${flag.sourceLocation}\n\n`;
      });
    }

    // XAI Data
    if (options.sections.xaiData && summary.xaiData) {
      markdown += `## Explainable AI Analysis\n\n`;
      markdown += `**Overall Confidence:** ${Math.round(summary.xaiData.confidenceBreakdown.overall * 100)}%\n\n`;
      
      if (summary.xaiData.decisionPathways.length > 0) {
        markdown += `### Decision Pathways\n\n`;
        summary.xaiData.decisionPathways.forEach((pathway, index) => {
          markdown += `${index + 1}. **${pathway.step}**\n`;
          markdown += `   - Reasoning: ${pathway.reasoning}\n`;
          markdown += `   - Confidence: ${Math.round(pathway.confidence * 100)}%\n`;
          markdown += `   - Sources: ${pathway.sources.join(', ')}\n\n`;
        });
      }
    }

    // Watermark
    if (options.includeWatermark) {
      markdown += `---\n\n`;
      markdown += `*Generated by SciAI Trust Toolkit on ${new Date().toLocaleDateString()}*\n`;
    }

    // Download
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${paper.title.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private static async exportToDocx(
    summary: Summary, 
    paper: Paper, 
    options: ExportOptions
  ): Promise<void> {
    // For DOCX, we'll create an HTML document that can be opened in Word
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Research Analysis Report</title>
        <style>
          body { font-family: 'Times New Roman', serif; line-height: 1.6; margin: 1in; }
          h1 { color: #2563eb; border-bottom: 2px solid #2563eb; }
          h2 { color: #1e40af; margin-top: 2em; }
          h3 { color: #1e3a8a; }
          .metadata { background-color: #f8fafc; padding: 1em; border-left: 4px solid #2563eb; }
          .citation { background-color: #f1f5f9; padding: 0.5em; margin: 0.5em 0; border-left: 3px solid #64748b; }
          .ethics-flag { background-color: #fef3c7; padding: 1em; margin: 1em 0; border-radius: 4px; }
          .high-severity { background-color: #fee2e2; }
          .medium-severity { background-color: #fef3c7; }
          .low-severity { background-color: #dbeafe; }
          .watermark { position: fixed; bottom: 20px; right: 20px; color: #9ca3af; font-size: 10px; }
        </style>
      </head>
      <body>
    `;

    html += `<h1>Research Analysis Report</h1>`;

    // Paper metadata
    if (options.sections.metadata) {
      html += `<div class="metadata">`;
      html += `<h2>Paper Information</h2>`;
      html += `<p><strong>Title:</strong> ${paper.title}</p>`;
      html += `<p><strong>Authors:</strong> ${paper.authors.join(', ')}</p>`;
      if (paper.doi) html += `<p><strong>DOI:</strong> ${paper.doi}</p>`;
      if (paper.metadata?.journal) html += `<p><strong>Journal:</strong> ${paper.metadata.journal}</p>`;
      if (paper.metadata?.publishedDate) html += `<p><strong>Published:</strong> ${paper.metadata.publishedDate}</p>`;
      html += `</div>`;
    }

    // Summary
    if (options.sections.summary) {
      html += `<h2>Summary</h2>`;
      html += `<p>${summary.content}</p>`;
    }

    // Key Points
    if (options.sections.keyPoints && summary.keyPoints.length > 0) {
      html += `<h2>Key Points</h2>`;
      html += `<ol>`;
      summary.keyPoints.forEach(point => {
        html += `<li>`;
        html += `<strong>${point.content}</strong><br>`;
        html += `<small>Importance: ${point.importance} | Source: ${point.sourceSection} | Confidence: ${Math.round(point.confidence * 100)}%</small>`;
        html += `</li>`;
      });
      html += `</ol>`;
    }

    // Limitations
    if (options.sections.limitations && summary.limitations.length > 0) {
      html += `<h2>Limitations</h2>`;
      html += `<ul>`;
      summary.limitations.forEach(limitation => {
        html += `<li>${limitation}</li>`;
      });
      html += `</ul>`;
    }

    // Citations
    if (options.sections.citations && summary.citations.length > 0) {
      html += `<h2>Citations</h2>`;
      summary.citations.forEach((citation, index) => {
        html += `<div class="citation">`;
        html += `<p><strong>${index + 1}.</strong> "${citation.text}"</p>`;
        html += `<small>Source: ${citation.sourceLocation} | Confidence: ${Math.round(citation.confidence * 100)}%</small>`;
        html += `</div>`;
      });
    }

    // Ethics Analysis
    if (options.sections.ethicsAnalysis && summary.ethicsFlags.length > 0) {
      html += `<h2>Ethics Analysis</h2>`;
      summary.ethicsFlags.forEach((flag, index) => {
        html += `<div class="ethics-flag ${flag.severity}-severity">`;
        html += `<h3>${index + 1}. ${flag.type.toUpperCase()} (${flag.severity} severity)</h3>`;
        html += `<p><strong>Description:</strong> ${flag.description}</p>`;
        html += `<p><strong>Recommendation:</strong> ${flag.recommendation}</p>`;
        if (flag.sourceLocation) html += `<p><strong>Location:</strong> ${flag.sourceLocation}</p>`;
        html += `</div>`;
      });
    }

    // XAI Data
    if (options.sections.xaiData && summary.xaiData) {
      html += `<h2>Explainable AI Analysis</h2>`;
      html += `<p><strong>Overall Confidence:</strong> ${Math.round(summary.xaiData.confidenceBreakdown.overall * 100)}%</p>`;
      
      if (summary.xaiData.decisionPathways.length > 0) {
        html += `<h3>Decision Pathways</h3>`;
        html += `<ol>`;
        summary.xaiData.decisionPathways.forEach(pathway => {
          html += `<li>`;
          html += `<strong>${pathway.step}</strong><br>`;
          html += `Reasoning: ${pathway.reasoning}<br>`;
          html += `<small>Confidence: ${Math.round(pathway.confidence * 100)}% | Sources: ${pathway.sources.join(', ')}</small>`;
          html += `</li>`;
        });
        html += `</ol>`;
      }
    }

    // Watermark
    if (options.includeWatermark) {
      html += `<div class="watermark">Generated by SciAI Trust Toolkit on ${new Date().toLocaleDateString()}</div>`;
    }

    html += `</body></html>`;

    // Download as HTML file that can be opened in Word
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${paper.title.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private static async exportToJSON(
    summary: Summary, 
    paper: Paper, 
    options: ExportOptions
  ): Promise<void> {
    const exportData: any = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        format: 'json',
        sections: options.sections,
        generatedBy: 'SciAI Trust Toolkit'
      }
    };

    if (options.sections.metadata) {
      exportData.paper = {
        id: paper.id,
        title: paper.title,
        authors: paper.authors,
        doi: paper.doi,
        url: paper.url,
        metadata: paper.metadata
      };
    }

    if (options.sections.summary) {
      exportData.summary = {
        id: summary.id,
        content: summary.content,
        confidence: summary.confidence,
        generatedAt: summary.generatedAt
      };
    }

    if (options.sections.keyPoints) {
      exportData.keyPoints = summary.keyPoints;
    }

    if (options.sections.limitations) {
      exportData.limitations = summary.limitations;
    }

    if (options.sections.citations) {
      exportData.citations = summary.citations;
    }

    if (options.sections.ethicsAnalysis) {
      exportData.ethicsFlags = summary.ethicsFlags;
    }

    if (options.sections.xaiData) {
      exportData.xaiData = summary.xaiData;
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${paper.title.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private static async exportToCSV(
    summary: Summary, 
    paper: Paper, 
    options: ExportOptions
  ): Promise<void> {
    let csv = '';

    // Paper metadata
    if (options.sections.metadata) {
      csv += 'Section,Field,Value\n';
      csv += `Paper,Title,"${paper.title.replace(/"/g, '""')}"\n`;
      csv += `Paper,Authors,"${paper.authors.join('; ').replace(/"/g, '""')}"\n`;
      if (paper.doi) csv += `Paper,DOI,"${paper.doi}"\n`;
      if (paper.metadata?.journal) csv += `Paper,Journal,"${paper.metadata.journal.replace(/"/g, '""')}"\n`;
      if (paper.metadata?.publishedDate) csv += `Paper,Published,"${paper.metadata.publishedDate}"\n`;
    }

    // Key Points
    if (options.sections.keyPoints && summary.keyPoints.length > 0) {
      csv += '\nKey Points\n';
      csv += 'Index,Content,Importance,Source,Confidence\n';
      summary.keyPoints.forEach((point, index) => {
        csv += `${index + 1},"${point.content.replace(/"/g, '""')}","${point.importance}","${point.sourceSection.replace(/"/g, '""')}",${point.confidence}\n`;
      });
    }

    // Ethics Flags
    if (options.sections.ethicsAnalysis && summary.ethicsFlags.length > 0) {
      csv += '\nEthics Flags\n';
      csv += 'Index,Type,Severity,Description,Recommendation\n';
      summary.ethicsFlags.forEach((flag, index) => {
        csv += `${index + 1},"${flag.type}","${flag.severity}","${flag.description.replace(/"/g, '""')}","${flag.recommendation.replace(/"/g, '""')}"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${paper.title.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}