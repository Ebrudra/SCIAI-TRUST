export interface AcademicPaper {
  title: string;
  authors: string[];
  abstract?: string;
  doi?: string;
  url?: string;
  journal?: string;
  publishedDate?: string;
  keywords?: string[];
  citations?: number;
  pdfUrl?: string;
  fullTextUrl?: string;
  metadata?: Record<string, any>;
}

export interface CrossRefWork {
  DOI: string;
  title: string[];
  author: Array<{
    given: string;
    family: string;
    ORCID?: string;
  }>;
  abstract?: string;
  'container-title': string[];
  published: {
    'date-parts': number[][];
  };
  subject?: string[];
  'is-referenced-by-count': number;
  URL: string;
  link?: Array<{
    URL: string;
    'content-type': string;
    'content-version': string;
  }>;
}

export class AcademicDatabaseService {
  private static readonly CROSSREF_API = 'https://api.crossref.org/works';
  private static readonly UNPAYWALL_API = 'https://api.unpaywall.org/v2';
  private static readonly SEMANTIC_SCHOLAR_API = 'https://api.semanticscholar.org/graph/v1/paper';
  
  // Email for Unpaywall API (required)
  private static readonly CONTACT_EMAIL = 'research@example.com';

  static async processPaperFromIdentifier(identifier: string): Promise<AcademicPaper> {
    const cleanIdentifier = this.cleanIdentifier(identifier);
    
    // Determine the type of identifier
    if (this.isDOI(cleanIdentifier)) {
      return await this.processDOI(cleanIdentifier);
    } else if (this.isArxivId(cleanIdentifier)) {
      return await this.processArxivId(cleanIdentifier);
    } else if (this.isPubMedId(cleanIdentifier)) {
      return await this.processPubMedId(cleanIdentifier);
    } else if (this.isURL(cleanIdentifier)) {
      return await this.processURL(cleanIdentifier);
    } else {
      throw new Error('Unsupported identifier format. Please provide a DOI, arXiv ID, PubMed ID, or URL.');
    }
  }

  private static async processDOI(doi: string): Promise<AcademicPaper> {
    try {
      // First, try to get metadata from CrossRef
      const crossrefData = await this.fetchFromCrossRef(doi);
      
      // Then try to get open access information from Unpaywall
      let unpaywallData = null;
      try {
        unpaywallData = await this.fetchFromUnpaywall(doi);
      } catch (error) {
        console.warn('Unpaywall data not available:', error);
      }

      // Try to get additional metadata from Semantic Scholar
      let semanticScholarData = null;
      try {
        semanticScholarData = await this.fetchFromSemanticScholar(doi);
      } catch (error) {
        console.warn('Semantic Scholar data not available:', error);
      }

      return this.mergePaperData(crossrefData, unpaywallData, semanticScholarData);
    } catch (error) {
      console.error('Error processing DOI:', error);
      throw new Error(`Failed to process DOI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async processArxivId(arxivId: string): Promise<AcademicPaper> {
    try {
      // ArXiv API endpoint
      const arxivUrl = `http://export.arxiv.org/api/query?id_list=${arxivId}`;
      
      const response = await fetch(arxivUrl);
      if (!response.ok) {
        throw new Error(`ArXiv API error: ${response.statusText}`);
      }

      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      const entry = xmlDoc.querySelector('entry');
      if (!entry) {
        throw new Error('Paper not found on ArXiv');
      }

      const title = entry.querySelector('title')?.textContent?.trim() || 'Unknown Title';
      const summary = entry.querySelector('summary')?.textContent?.trim();
      const published = entry.querySelector('published')?.textContent?.trim();
      
      const authors = Array.from(entry.querySelectorAll('author name')).map(
        author => author.textContent?.trim() || ''
      ).filter(name => name.length > 0);

      const categories = Array.from(entry.querySelectorAll('category')).map(
        cat => cat.getAttribute('term') || ''
      ).filter(term => term.length > 0);

      const pdfUrl = entry.querySelector('link[type="application/pdf"]')?.getAttribute('href');

      return {
        title,
        authors,
        abstract: summary,
        url: `https://arxiv.org/abs/${arxivId}`,
        pdfUrl,
        publishedDate: published ? new Date(published).toISOString().split('T')[0] : undefined,
        keywords: categories,
        metadata: {
          source: 'arxiv',
          arxivId,
          categories
        }
      };
    } catch (error) {
      console.error('Error processing ArXiv ID:', error);
      throw new Error(`Failed to process ArXiv ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async processPubMedId(pubmedId: string): Promise<AcademicPaper> {
    try {
      // PubMed E-utilities API
      const esummaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pubmedId}&retmode=json`;
      
      const response = await fetch(esummaryUrl);
      if (!response.ok) {
        throw new Error(`PubMed API error: ${response.statusText}`);
      }

      const data = await response.json();
      const result = data.result[pubmedId];
      
      if (!result) {
        throw new Error('Paper not found on PubMed');
      }

      const authors = result.authors?.map((author: any) => author.name) || [];
      const publishedDate = result.pubdate ? this.parsePubMedDate(result.pubdate) : undefined;

      return {
        title: result.title || 'Unknown Title',
        authors,
        journal: result.fulljournalname || result.source,
        publishedDate,
        url: `https://pubmed.ncbi.nlm.nih.gov/${pubmedId}/`,
        doi: result.articleids?.find((id: any) => id.idtype === 'doi')?.value,
        metadata: {
          source: 'pubmed',
          pubmedId,
          pmcId: result.articleids?.find((id: any) => id.idtype === 'pmc')?.value,
          volume: result.volume,
          issue: result.issue,
          pages: result.pages
        }
      };
    } catch (error) {
      console.error('Error processing PubMed ID:', error);
      throw new Error(`Failed to process PubMed ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async processURL(url: string): Promise<AcademicPaper> {
    try {
      // Try to extract DOI from URL
      const doiFromUrl = this.extractDOIFromURL(url);
      if (doiFromUrl) {
        return await this.processDOI(doiFromUrl);
      }

      // Try to extract ArXiv ID from URL
      const arxivIdFromUrl = this.extractArxivIdFromURL(url);
      if (arxivIdFromUrl) {
        return await this.processArxivId(arxivIdFromUrl);
      }

      // Try to extract PubMed ID from URL
      const pubmedIdFromUrl = this.extractPubMedIdFromURL(url);
      if (pubmedIdFromUrl) {
        return await this.processPubMedId(pubmedIdFromUrl);
      }

      // For other URLs, try to fetch basic metadata
      return await this.processGenericURL(url);
    } catch (error) {
      console.error('Error processing URL:', error);
      throw new Error(`Failed to process URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async fetchFromCrossRef(doi: string): Promise<Partial<AcademicPaper>> {
    const response = await fetch(`${this.CROSSREF_API}/${doi}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SciAI-Trust-Toolkit/1.0 (mailto:research@example.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`CrossRef API error: ${response.statusText}`);
    }

    const data = await response.json();
    const work: CrossRefWork = data.message;

    const authors = work.author?.map(author => 
      `${author.given || ''} ${author.family || ''}`.trim()
    ) || [];

    const publishedDate = work.published?.['date-parts']?.[0] ? 
      `${work.published['date-parts'][0][0]}-${String(work.published['date-parts'][0][1] || 1).padStart(2, '0')}-${String(work.published['date-parts'][0][2] || 1).padStart(2, '0')}` : 
      undefined;

    return {
      title: work.title?.[0] || 'Unknown Title',
      authors,
      doi: work.DOI,
      journal: work['container-title']?.[0],
      publishedDate,
      keywords: work.subject,
      citations: work['is-referenced-by-count'],
      url: work.URL,
      metadata: {
        source: 'crossref',
        crossrefData: work
      }
    };
  }

  private static async fetchFromUnpaywall(doi: string): Promise<any> {
    const response = await fetch(`${this.UNPAYWALL_API}/${doi}?email=${this.CONTACT_EMAIL}`);
    
    if (!response.ok) {
      throw new Error(`Unpaywall API error: ${response.statusText}`);
    }

    return await response.json();
  }

  private static async fetchFromSemanticScholar(doi: string): Promise<any> {
    const response = await fetch(`${this.SEMANTIC_SCHOLAR_API}/DOI:${doi}?fields=title,authors,abstract,year,citationCount,openAccessPdf,url`);
    
    if (!response.ok) {
      throw new Error(`Semantic Scholar API error: ${response.statusText}`);
    }

    return await response.json();
  }

  private static async processGenericURL(url: string): Promise<AcademicPaper> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SciAI-Trust-Toolkit/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extract basic metadata from HTML
      const title = this.extractTitleFromHTML(doc);
      const authors = this.extractAuthorsFromHTML(doc);
      const abstract = this.extractAbstractFromHTML(doc);
      const doi = this.extractDOIFromHTML(doc);

      return {
        title: title || 'Unknown Title',
        authors: authors.length > 0 ? authors : ['Unknown Author'],
        abstract,
        doi,
        url,
        metadata: {
          source: 'generic-url',
          extractedFromHTML: true
        }
      };
    } catch (error) {
      throw new Error(`Failed to process generic URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static mergePaperData(
    crossrefData: Partial<AcademicPaper>,
    unpaywallData: any,
    semanticScholarData: any
  ): AcademicPaper {
    const merged: AcademicPaper = {
      title: crossrefData.title || 'Unknown Title',
      authors: crossrefData.authors || [],
      doi: crossrefData.doi,
      journal: crossrefData.journal,
      publishedDate: crossrefData.publishedDate,
      keywords: crossrefData.keywords,
      citations: crossrefData.citations,
      url: crossrefData.url,
      metadata: {
        ...crossrefData.metadata,
        sources: ['crossref']
      }
    };

    // Merge Unpaywall data
    if (unpaywallData) {
      merged.pdfUrl = unpaywallData.best_oa_location?.url_for_pdf;
      merged.fullTextUrl = unpaywallData.best_oa_location?.host_type === 'publisher' ? 
        unpaywallData.best_oa_location.url : undefined;
      merged.metadata!.unpaywall = unpaywallData;
      merged.metadata!.sources.push('unpaywall');
    }

    // Merge Semantic Scholar data
    if (semanticScholarData) {
      if (!merged.abstract && semanticScholarData.abstract) {
        merged.abstract = semanticScholarData.abstract;
      }
      if (!merged.pdfUrl && semanticScholarData.openAccessPdf?.url) {
        merged.pdfUrl = semanticScholarData.openAccessPdf.url;
      }
      merged.metadata!.semanticScholar = semanticScholarData;
      merged.metadata!.sources.push('semantic-scholar');
    }

    return merged;
  }

  // Utility methods for identifier detection and extraction
  private static cleanIdentifier(identifier: string): string {
    return identifier.replace(/\s+/g, '').replace(/^(doi:|DOI:)/, '');
  }

  private static isDOI(identifier: string): boolean {
    return /^10\.\d{4,}\/[^\s]+$/.test(identifier);
  }

  private static isArxivId(identifier: string): boolean {
    return /^(\d{4}\.\d{4,5}|[a-z-]+\/\d{7})$/i.test(identifier);
  }

  private static isPubMedId(identifier: string): boolean {
    return /^\d{8}$/.test(identifier);
  }

  private static isURL(identifier: string): boolean {
    try {
      new URL(identifier);
      return true;
    } catch {
      return false;
    }
  }

  private static extractDOIFromURL(url: string): string | null {
    const doiMatch = url.match(/(?:doi\.org\/|doi:|DOI:)?(10\.\d{4,}\/[^\s?&#]+)/i);
    return doiMatch ? doiMatch[1] : null;
  }

  private static extractArxivIdFromURL(url: string): string | null {
    const arxivMatch = url.match(/arxiv\.org\/(?:abs|pdf)\/([^/?&#]+)/i);
    return arxivMatch ? arxivMatch[1] : null;
  }

  private static extractPubMedIdFromURL(url: string): string | null {
    const pubmedMatch = url.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/i);
    return pubmedMatch ? pubmedMatch[1] : null;
  }

  private static extractTitleFromHTML(doc: Document): string | null {
    // Try various meta tags and selectors for title
    const selectors = [
      'meta[name="citation_title"]',
      'meta[property="og:title"]',
      'meta[name="dc.title"]',
      'title',
      'h1'
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const content = element.getAttribute('content') || element.textContent;
        if (content && content.trim().length > 0) {
          return content.trim();
        }
      }
    }

    return null;
  }

  private static extractAuthorsFromHTML(doc: Document): string[] {
    const authorSelectors = [
      'meta[name="citation_author"]',
      'meta[name="dc.creator"]',
      'meta[name="author"]'
    ];

    const authors: string[] = [];

    for (const selector of authorSelectors) {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(element => {
        const content = element.getAttribute('content');
        if (content && content.trim().length > 0) {
          authors.push(content.trim());
        }
      });
    }

    return authors;
  }

  private static extractAbstractFromHTML(doc: Document): string | null {
    const abstractSelectors = [
      'meta[name="citation_abstract"]',
      'meta[name="dc.description"]',
      'meta[name="description"]',
      '.abstract',
      '#abstract'
    ];

    for (const selector of abstractSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const content = element.getAttribute('content') || element.textContent;
        if (content && content.trim().length > 50) {
          return content.trim();
        }
      }
    }

    return null;
  }

  private static extractDOIFromHTML(doc: Document): string | null {
    const doiSelectors = [
      'meta[name="citation_doi"]',
      'meta[name="dc.identifier"][content*="10."]'
    ];

    for (const selector of doiSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const content = element.getAttribute('content');
        if (content && this.isDOI(content.replace(/^doi:/, ''))) {
          return content.replace(/^doi:/, '');
        }
      }
    }

    return null;
  }

  private static parsePubMedDate(pubdate: string): string {
    try {
      const date = new Date(pubdate);
      return date.toISOString().split('T')[0];
    } catch {
      return pubdate;
    }
  }
}