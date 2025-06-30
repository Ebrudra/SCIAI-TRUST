import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure PDF.js worker with local worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface PDFExtractionResult {
  text: string;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modificationDate?: string;
    pageCount: number;
    wordCount: number;
    extractedAt: string;
    fileSize: number;
    fileName: string;
  };
  pages: Array<{
    pageNumber: number;
    text: string;
    wordCount: number;
  }>;
  structure: {
    hasAbstract: boolean;
    hasIntroduction: boolean;
    hasMethodology: boolean;
    hasResults: boolean;
    hasConclusion: boolean;
    hasReferences: boolean;
    sections: string[];
  };
}

export class PDFProcessor {
  static async extractTextFromFile(file: File): Promise<PDFExtractionResult> {
    try {
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Extract metadata
      const metadata = await pdf.getMetadata();
      const info = metadata.info;
      
      // Extract text from all pages
      const pages: Array<{ pageNumber: number; text: string; wordCount: number }> = [];
      let fullText = '';
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items with proper spacing
        const pageText = textContent.items
          .map((item: any) => {
            if ('str' in item) {
              return item.str;
            }
            return '';
          })
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        const wordCount = pageText.split(/\s+/).filter(word => word.length > 0).length;
        
        pages.push({
          pageNumber: pageNum,
          text: pageText,
          wordCount
        });
        
        fullText += pageText + '\n\n';
      }
      
      // Clean up the full text
      fullText = this.cleanExtractedText(fullText);
      const totalWordCount = fullText.split(/\s+/).filter(word => word.length > 0).length;
      
      // Analyze document structure
      const structure = this.analyzeDocumentStructure(fullText);
      
      return {
        text: fullText,
        metadata: {
          title: info.Title || undefined,
          author: info.Author || undefined,
          subject: info.Subject || undefined,
          creator: info.Creator || undefined,
          producer: info.Producer || undefined,
          creationDate: info.CreationDate || undefined,
          modificationDate: info.ModDate || undefined,
          pageCount: pdf.numPages,
          wordCount: totalWordCount,
          extractedAt: new Date().toISOString(),
          fileSize: file.size,
          fileName: file.name
        },
        pages,
        structure
      };
      
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private static cleanExtractedText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove page numbers and headers/footers (simple heuristic)
      .replace(/^\d+\s*$/gm, '')
      // Remove isolated single characters
      .replace(/\b\w\b/g, '')
      // Clean up line breaks
      .replace(/\n\s*\n/g, '\n\n')
      // Remove leading/trailing whitespace
      .trim();
  }
  
  private static analyzeDocumentStructure(text: string): PDFExtractionResult['structure'] {
    const lowerText = text.toLowerCase();
    
    // Common section headers and patterns
    const abstractPattern = /\b(abstract|summary)\b/i;
    const introPattern = /\b(introduction|background)\b/i;
    const methodPattern = /\b(method|methodology|approach|procedure)\b/i;
    const resultsPattern = /\b(results|findings|outcomes)\b/i;
    const conclusionPattern = /\b(conclusion|discussion|summary)\b/i;
    const referencesPattern = /\b(references|bibliography|works cited)\b/i;
    
    // Extract potential section headers (lines that are short and likely headers)
    const lines = text.split('\n');
    const potentialSections = lines
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 3 && 
               trimmed.length < 100 && 
               /^[A-Z]/.test(trimmed) &&
               !trimmed.includes('.');
      })
      .slice(0, 20); // Limit to first 20 potential sections
    
    return {
      hasAbstract: abstractPattern.test(lowerText),
      hasIntroduction: introPattern.test(lowerText),
      hasMethodology: methodPattern.test(lowerText),
      hasResults: resultsPattern.test(lowerText),
      hasConclusion: conclusionPattern.test(lowerText),
      hasReferences: referencesPattern.test(lowerText),
      sections: potentialSections
    };
  }
  
  static extractAuthorsFromText(text: string): string[] {
    // Enhanced author extraction patterns
    const patterns = [
      // Pattern: "Authors: John Doe, Jane Smith"
      /(?:authors?|by)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]*)*(?:\s*,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]*)*)*)/i,
      // Pattern: Multiple names at the beginning
      /^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+\s+[A-Z][a-z]+)*)/m,
      // Pattern: Names with affiliations
      /([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s*\d+)?(?:\s*,\s*([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s*\d+)?)*\s*(?:\n|$)/m
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const authorsString = match[1];
        const authors = authorsString
          .split(/,\s*/)
          .map(author => author.trim())
          .filter(author => author.length > 3 && author.length < 50)
          .slice(0, 10); // Limit to 10 authors max
        
        if (authors.length > 0) {
          return authors;
        }
      }
    }
    
    return [];
  }
  
  static extractTitleFromText(text: string): string | null {
    // Look for title in first few lines
    const lines = text.split('\n').slice(0, 10);
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Title is usually longer than 10 chars, shorter than 200, and doesn't end with period
      if (trimmed.length > 10 && 
          trimmed.length < 200 && 
          !trimmed.endsWith('.') &&
          /^[A-Z]/.test(trimmed) &&
          !trimmed.toLowerCase().includes('abstract')) {
        return trimmed;
      }
    }
    
    return null;
  }
  
  static extractAbstract(text: string): string | null {
    const abstractMatch = text.match(/\babstract\b\s*:?\s*(.*?)(?=\n\s*\n|\b(?:introduction|keywords|1\.)\b)/is);
    if (abstractMatch) {
      return abstractMatch[1].trim().substring(0, 1000); // Limit abstract length
    }
    return null;
  }
  
  static extractKeywords(text: string): string[] {
    const keywordMatch = text.match(/\bkeywords?\b\s*:?\s*(.*?)(?=\n\s*\n|\b(?:introduction|abstract)\b)/is);
    if (keywordMatch) {
      return keywordMatch[1]
        .split(/[,;]/)
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 2 && keyword.length < 50)
        .slice(0, 10);
    }
    return [];
  }
}