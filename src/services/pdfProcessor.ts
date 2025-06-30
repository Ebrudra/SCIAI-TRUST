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
    console.log('🔄 Starting PDF text extraction...');
    console.log(`📄 File: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    try {
      // Set a timeout for the entire extraction process
      const extractionPromise = this.performExtraction(file);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('PDF extraction timeout after 30 seconds')), 30000);
      });

      const result = await Promise.race([extractionPromise, timeoutPromise]);
      console.log('✅ PDF extraction completed successfully');
      return result;
      
    } catch (error) {
      console.error('❌ PDF extraction failed:', error);
      
      // Provide a fallback result instead of throwing
      console.log('🔄 Creating fallback extraction result...');
      return this.createFallbackResult(file, error);
    }
  }

  private static async performExtraction(file: File): Promise<PDFExtractionResult> {
    try {
      // Convert file to ArrayBuffer with progress tracking
      console.log('📖 Reading file...');
      const arrayBuffer = await this.readFileWithTimeout(file);
      console.log('✅ File read successfully');
      
      // Load PDF document with timeout
      console.log('🔍 Loading PDF document...');
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0, // Reduce logging
        maxImageSize: 1024 * 1024, // Limit image size to prevent memory issues
        disableFontFace: true, // Disable font loading for faster processing
        disableRange: false,
        disableStream: false
      });

      // Set timeout for PDF loading
      const pdf = await Promise.race([
        loadingTask.promise,
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            loadingTask.destroy();
            reject(new Error('PDF loading timeout'));
          }, 15000);
        })
      ]);

      console.log(`✅ PDF loaded successfully (${pdf.numPages} pages)`);
      
      // Extract metadata with timeout
      console.log('📋 Extracting metadata...');
      let metadata;
      try {
        metadata = await Promise.race([
          pdf.getMetadata(),
          new Promise<any>((_, reject) => {
            setTimeout(() => reject(new Error('Metadata timeout')), 5000);
          })
        ]);
      } catch (metaError) {
        console.warn('⚠️ Metadata extraction failed, using defaults');
        metadata = { info: {} };
      }

      const info = metadata.info || {};
      
      // Extract text from pages with progress tracking
      console.log('📝 Extracting text from pages...');
      const pages: Array<{ pageNumber: number; text: string; wordCount: number }> = [];
      let fullText = '';
      
      // Limit pages to prevent memory issues
      const maxPages = Math.min(pdf.numPages, 50);
      console.log(`📄 Processing ${maxPages} pages (limited from ${pdf.numPages})`);
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        try {
          console.log(`📄 Processing page ${pageNum}/${maxPages}...`);
          
          const pagePromise = this.extractPageText(pdf, pageNum);
          const timeoutPromise = new Promise<string>((_, reject) => {
            setTimeout(() => reject(new Error(`Page ${pageNum} timeout`)), 10000);
          });

          const pageText = await Promise.race([pagePromise, timeoutPromise]);
          
          const wordCount = pageText.split(/\s+/).filter(word => word.length > 0).length;
          
          pages.push({
            pageNumber: pageNum,
            text: pageText,
            wordCount
          });
          
          fullText += pageText + '\n\n';
          
          // Add small delay to prevent blocking
          if (pageNum % 5 === 0) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          
        } catch (pageError) {
          console.warn(`⚠️ Failed to extract page ${pageNum}:`, pageError);
          // Continue with other pages
          pages.push({
            pageNumber: pageNum,
            text: `[Page ${pageNum} extraction failed]`,
            wordCount: 0
          });
        }
      }
      
      // Clean up the full text
      console.log('🧹 Cleaning extracted text...');
      fullText = this.cleanExtractedText(fullText);
      const totalWordCount = fullText.split(/\s+/).filter(word => word.length > 0).length;
      
      console.log(`📊 Extraction stats: ${totalWordCount} words from ${pages.length} pages`);
      
      // Analyze document structure
      console.log('🔍 Analyzing document structure...');
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
      console.error('❌ Error in performExtraction:', error);
      throw error;
    }
  }

  private static async readFileWithTimeout(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const timeout = setTimeout(() => {
        reader.abort();
        reject(new Error('File reading timeout'));
      }, 10000);

      reader.onload = () => {
        clearTimeout(timeout);
        resolve(reader.result as ArrayBuffer);
      };

      reader.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('File reading failed'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  private static async extractPageText(pdf: any, pageNum: number): Promise<string> {
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
    
    return pageText;
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