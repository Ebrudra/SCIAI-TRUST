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
    console.log('🔄 Starting optimized PDF text extraction...');
    console.log(`📄 File: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    try {
      // Quick validation
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        throw new Error('File too large. Please use a file smaller than 100MB.');
      }

      // Perform extraction with optimizations
      const result = await this.performOptimizedExtraction(file);
      console.log('✅ PDF extraction completed successfully');
      return result;
      
    } catch (error) {
      console.error('❌ PDF extraction failed:', error);
      
      // Provide a fallback result instead of throwing
      console.log('🔄 Creating fallback extraction result...');
      return this.createFallbackResult(file, error);
    }
  }

  private static async performOptimizedExtraction(file: File): Promise<PDFExtractionResult> {
    try {
      // Convert file to ArrayBuffer quickly
      console.log('📖 Reading file...');
      const arrayBuffer = await file.arrayBuffer();
      console.log('✅ File read successfully');
      
      // Load PDF document with optimized settings
      console.log('🔍 Loading PDF document...');
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0, // Reduce logging
        maxImageSize: 512 * 512, // Smaller image limit for speed
        disableFontFace: true, // Disable font loading
        disableRange: false,
        disableStream: false,
        useSystemFonts: false, // Don't load system fonts
        standardFontDataUrl: undefined // Don't load standard fonts
      }).promise;

      console.log(`✅ PDF loaded successfully (${pdf.numPages} pages)`);
      
      // Extract metadata quickly
      console.log('📋 Extracting metadata...');
      let metadata;
      try {
        metadata = await pdf.getMetadata();
      } catch (metaError) {
        console.warn('⚠️ Metadata extraction failed, using defaults');
        metadata = { info: {} };
      }

      const info = metadata.info || {};
      
      // Extract text from pages with optimizations
      console.log('📝 Extracting text from pages...');
      const pages: Array<{ pageNumber: number; text: string; wordCount: number }> = [];
      let fullText = '';
      
      // Process pages in batches for better performance
      const maxPages = Math.min(pdf.numPages, 100); // Increased limit but still reasonable
      const batchSize = 5; // Process 5 pages at a time
      
      console.log(`📄 Processing ${maxPages} pages in batches of ${batchSize}`);
      
      for (let startPage = 1; startPage <= maxPages; startPage += batchSize) {
        const endPage = Math.min(startPage + batchSize - 1, maxPages);
        console.log(`📄 Processing batch: pages ${startPage}-${endPage}`);
        
        // Process batch of pages concurrently
        const batchPromises = [];
        for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
          batchPromises.push(this.extractPageTextOptimized(pdf, pageNum));
        }
        
        try {
          const batchResults = await Promise.all(batchPromises);
          
          batchResults.forEach((pageText, index) => {
            const pageNum = startPage + index;
            const wordCount = pageText.split(/\s+/).filter(word => word.length > 0).length;
            
            pages.push({
              pageNumber: pageNum,
              text: pageText,
              wordCount
            });
            
            fullText += pageText + '\n\n';
          });
          
        } catch (batchError) {
          console.warn(`⚠️ Failed to process batch ${startPage}-${endPage}:`, batchError);
          // Add placeholder pages for failed batch
          for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
            pages.push({
              pageNumber: pageNum,
              text: `[Page ${pageNum} extraction failed]`,
              wordCount: 0
            });
          }
        }
        
        // Small delay between batches to prevent blocking
        if (endPage < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      // Clean up the full text efficiently
      console.log('🧹 Cleaning extracted text...');
      fullText = this.cleanExtractedTextOptimized(fullText);
      const totalWordCount = fullText.split(/\s+/).filter(word => word.length > 0).length;
      
      console.log(`📊 Extraction stats: ${totalWordCount} words from ${pages.length} pages`);
      
      // Analyze document structure quickly
      console.log('🔍 Analyzing document structure...');
      const structure = this.analyzeDocumentStructureOptimized(fullText);
      
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
          pageCount: pages.length,
          wordCount: totalWordCount,
          extractedAt: new Date().toISOString(),
          fileSize: file.size,
          fileName: file.name
        },
        pages,
        structure
      };
      
    } catch (error) {
      console.error('❌ Error in performOptimizedExtraction:', error);
      throw error;
    }
  }

  private static async extractPageTextOptimized(pdf: any, pageNum: number): Promise<string> {
    try {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent({
        normalizeWhitespace: true,
        disableCombineTextItems: false
      });
      
      // Optimized text combination
      const textItems = textContent.items;
      const pageText = textItems
        .filter((item: any) => item.str && item.str.trim().length > 0)
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      return pageText;
    } catch (error) {
      console.warn(`⚠️ Failed to extract page ${pageNum}:`, error);
      return `[Page ${pageNum} extraction failed]`;
    }
  }

  private static createFallbackResult(file: File, error: any): PDFExtractionResult {
    console.log('🔄 Creating fallback result due to extraction failure');
    
    const fallbackText = `PDF extraction failed for "${file.name}". 
    
Error: ${error.message || 'Unknown error'}
    
This appears to be a PDF document that could not be processed automatically. 
The file may be:
- A scanned document requiring OCR
- Password protected
- Corrupted or malformed
- Too large or complex for browser-based processing

Please try:
1. Using a different PDF file
2. Converting scanned PDFs to text-searchable format
3. Using the DOI/URL option if available
4. Reducing file size if the PDF is very large

File details:
- Name: ${file.name}
- Size: ${(file.size / 1024 / 1024).toFixed(2)} MB
- Type: ${file.type}`;

    return {
      text: fallbackText,
      metadata: {
        title: file.name.replace('.pdf', ''),
        pageCount: 1,
        wordCount: fallbackText.split(/\s+/).length,
        extractedAt: new Date().toISOString(),
        fileSize: file.size,
        fileName: file.name
      },
      pages: [{
        pageNumber: 1,
        text: fallbackText,
        wordCount: fallbackText.split(/\s+/).length
      }],
      structure: {
        hasAbstract: false,
        hasIntroduction: false,
        hasMethodology: false,
        hasResults: false,
        hasConclusion: false,
        hasReferences: false,
        sections: ['Error Report']
      }
    };
  }
  
  private static cleanExtractedTextOptimized(text: string): string {
    // Optimized text cleaning with fewer regex operations
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/^\d+\s*$/gm, '') // Remove page numbers
      .replace(/\n\s*\n/g, '\n\n') // Clean line breaks
      .trim();
  }
  
  private static analyzeDocumentStructureOptimized(text: string): PDFExtractionResult['structure'] {
    const lowerText = text.toLowerCase();
    
    // Use simple includes for faster matching
    const hasAbstract = lowerText.includes('abstract') || lowerText.includes('summary');
    const hasIntroduction = lowerText.includes('introduction') || lowerText.includes('background');
    const hasMethodology = lowerText.includes('method') || lowerText.includes('approach') || lowerText.includes('procedure');
    const hasResults = lowerText.includes('results') || lowerText.includes('findings') || lowerText.includes('outcomes');
    const hasConclusion = lowerText.includes('conclusion') || lowerText.includes('discussion');
    const hasReferences = lowerText.includes('references') || lowerText.includes('bibliography');
    
    // Quick section extraction
    const lines = text.split('\n').slice(0, 50); // Only check first 50 lines
    const potentialSections = lines
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 3 && 
               trimmed.length < 100 && 
               /^[A-Z]/.test(trimmed) &&
               !trimmed.includes('.');
      })
      .slice(0, 15); // Limit to first 15 sections
    
    return {
      hasAbstract,
      hasIntroduction,
      hasMethodology,
      hasResults,
      hasConclusion,
      hasReferences,
      sections: potentialSections
    };
  }
  
  static extractAuthorsFromText(text: string): string[] {
    // Optimized author extraction with fewer regex operations
    const patterns = [
      /(?:authors?|by)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]*)*(?:\s*,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]*)*)*)/i,
      /^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+\s+[A-Z][a-z]+)*)/m
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const authors = match[1]
          .split(/,\s*/)
          .map(author => author.trim())
          .filter(author => author.length > 3 && author.length < 50)
          .slice(0, 10);
        
        if (authors.length > 0) {
          return authors;
        }
      }
    }
    
    return [];
  }
  
  static extractTitleFromText(text: string): string | null {
    // Quick title extraction from first few lines
    const lines = text.split('\n').slice(0, 5);
    
    for (const line of lines) {
      const trimmed = line.trim();
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
      return abstractMatch[1].trim().substring(0, 1000);
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