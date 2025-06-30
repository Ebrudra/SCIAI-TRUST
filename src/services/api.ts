import { createClient } from '@supabase/supabase-js'
import { Paper, Summary } from '../types'
import { LLMService, LLMProvider } from './llm'
import { PDFProcessor } from './pdfProcessor'
import { AcademicDatabaseService } from './academicDatabase'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export class ApiService {
  static async uploadPaper(file: File): Promise<Paper> {
    try {
      // Extract text and metadata from PDF using client-side processing
      const extractionResult = await PDFProcessor.extractTextFromFile(file);
      
      // Extract title and authors from the PDF content
      const title = extractionResult.metadata.title || 
                   PDFProcessor.extractTitleFromText(extractionResult.text) || 
                   this.extractTitleFromFilename(file.name);
      
      const authors = extractionResult.metadata.author ? 
                     [extractionResult.metadata.author] : 
                     PDFProcessor.extractAuthorsFromText(extractionResult.text);

      // Enhanced metadata with user context
      const enhancedMetadata = {
        ...extractionResult.metadata,
        originalFilename: file.name,
        uploadedAt: new Date().toISOString(),
        abstract: PDFProcessor.extractAbstract(extractionResult.text),
        keywords: PDFProcessor.extractKeywords(extractionResult.text),
        structure: extractionResult.structure,
        pages: extractionResult.pages.map(page => ({
          pageNumber: page.pageNumber,
          wordCount: page.wordCount
        }))
      };

      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';

      // Create paper record in database
      const { data: paper, error } = await supabase
        .from('papers')
        .insert({
          title,
          authors: authors.length > 0 ? authors : ['Unknown Author'],
          content: extractionResult.text,
          metadata: {
            ...enhancedMetadata,
            uploadedBy: userId
          }
        })
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        throw new Error('Failed to save paper to database')
      }

      return {
        id: paper.id,
        title: paper.title,
        authors: paper.authors,
        content: paper.content,
        uploadedFile: file,
        metadata: paper.metadata
      }
    } catch (error) {
      console.error('Error uploading paper:', error);
      
      // Fallback: try server-side extraction
      try {
        return await this.uploadPaperWithServerExtraction(file);
      } catch (fallbackError) {
        console.error('Server extraction also failed:', fallbackError);
        throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private static async uploadPaperWithServerExtraction(file: File): Promise<Paper> {
    // Fallback to server-side extraction
    const formData = new FormData()
    formData.append('file', file)

    const extractResponse = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: formData,
      }
    )

    if (!extractResponse.ok) {
      const errorData = await extractResponse.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to extract PDF content')
    }

    const { text, metadata, structure } = await extractResponse.json()

    // Extract title and authors from server response
    const title = metadata.title || this.extractTitleFromFilename(file.name)
    const authors = metadata.authors || ['Unknown Author']

    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'anonymous';

    // Create paper record in database
    const { data: paper, error } = await supabase
      .from('papers')
      .insert({
        title,
        authors,
        content: text,
        metadata: {
          ...metadata,
          structure,
          originalFilename: file.name,
          uploadedAt: new Date().toISOString(),
          extractionMethod: 'server-side',
          uploadedBy: userId
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to save paper to database')
    }

    return {
      id: paper.id,
      title: paper.title,
      authors: paper.authors,
      content: paper.content,
      uploadedFile: file,
      metadata: paper.metadata
    }
  }

  static async processPaperFromUrl(identifier: string, title?: string): Promise<Paper> {
    try {
      // Use the academic database service to process the identifier
      const academicPaper = await AcademicDatabaseService.processPaperFromIdentifier(identifier);
      
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';
      
      // Create paper record in database
      const { data: paper, error } = await supabase
        .from('papers')
        .insert({
          title: title || academicPaper.title,
          authors: academicPaper.authors.length > 0 ? academicPaper.authors : ['Unknown Author'],
          url: academicPaper.url,
          doi: academicPaper.doi,
          content: academicPaper.abstract, // Store abstract as initial content
          metadata: {
            ...academicPaper.metadata,
            journal: academicPaper.journal,
            publishedDate: academicPaper.publishedDate,
            keywords: academicPaper.keywords,
            citations: academicPaper.citations,
            pdfUrl: academicPaper.pdfUrl,
            fullTextUrl: academicPaper.fullTextUrl,
            abstract: academicPaper.abstract,
            submittedAt: new Date().toISOString(),
            source: 'academic-database',
            uploadedBy: userId
          }
        })
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        throw new Error('Failed to save paper information to database')
      }

      return {
        id: paper.id,
        title: paper.title,
        authors: paper.authors,
        url: paper.url,
        doi: paper.doi,
        content: paper.content,
        metadata: paper.metadata
      }
    } catch (error) {
      console.error('Error processing paper from identifier:', error)
      throw error instanceof Error ? error : new Error('Unknown error occurred while processing identifier')
    }
  }

  static async generateSummary(paper: Paper, provider: LLMProvider = 'openai'): Promise<Summary> {
    try {
      // If we have content, use it directly for analysis
      if (paper.content) {
        return await this.generateSummaryFromContent(paper, paper.content, provider)
      }

      // If we have a URL or DOI, try to fetch full text
      if (paper.url || paper.doi) {
        return await this.generateSummaryFromIdentifier(paper, provider)
      }

      throw new Error('No content or identifier available for analysis')
    } catch (error) {
      console.error('Error generating summary:', error)
      throw error instanceof Error ? error : new Error('Failed to generate summary')
    }
  }

  private static async generateSummaryFromContent(paper: Paper, content: string, provider: LLMProvider): Promise<Summary> {
    try {
      // Use LLM service for analysis
      const analysis = await LLMService.analyzePaper(content, paper.title, provider)

      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';

      // Store summary in database
      const { data: summary, error } = await supabase
        .from('summaries')
        .insert({
          paper_id: paper.id,
          content: analysis.content,
          key_points: analysis.keyPoints,
          limitations: analysis.limitations,
          citations: analysis.citations,
          confidence: analysis.confidence,
          ethics_flags: analysis.ethicsFlags,
          xai_data: analysis.xaiData,
          metadata: {
            provider,
            generatedBy: userId,
            generatedAt: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (error) {
        console.error('Database error storing summary:', error)
        throw new Error('Failed to save analysis results')
      }

      return this.transformDatabaseSummary(summary, analysis.researchGaps)
    } catch (error) {
      console.error('Error in content analysis:', error)
      throw error
    }
  }

  private static async generateSummaryFromIdentifier(paper: Paper, provider: LLMProvider): Promise<Summary> {
    try {
      // Try to get full text content if available
      let fullTextContent = paper.content || '';

      // If we have a PDF URL, try to fetch and extract it
      if (paper.metadata?.pdfUrl && !fullTextContent) {
        try {
          const pdfResponse = await fetch(paper.metadata.pdfUrl);
          if (pdfResponse.ok) {
            const pdfBlob = await pdfResponse.blob();
            const pdfFile = new File([pdfBlob], 'paper.pdf', { type: 'application/pdf' });
            const extractionResult = await PDFProcessor.extractTextFromFile(pdfFile);
            fullTextContent = extractionResult.text;
            
            // Update paper content in database
            await supabase
              .from('papers')
              .update({ content: fullTextContent })
              .eq('id', paper.id);
          }
        } catch (pdfError) {
          console.warn('Failed to fetch PDF content:', pdfError);
        }
      }

      // If we still don't have content, use the abstract or metadata
      if (!fullTextContent) {
        fullTextContent = paper.metadata?.abstract || 
                         `Title: ${paper.title}\nAuthors: ${paper.authors.join(', ')}\nJournal: ${paper.metadata?.journal || 'Unknown'}\nPublished: ${paper.metadata?.publishedDate || 'Unknown'}`;
      }

      // Generate analysis using available content
      const analysis = await LLMService.analyzePaper(fullTextContent, paper.title, provider);

      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';

      // Store summary in database
      const { data: summary, error } = await supabase
        .from('summaries')
        .insert({
          paper_id: paper.id,
          content: analysis.content,
          key_points: analysis.keyPoints,
          limitations: analysis.limitations,
          citations: analysis.citations,
          confidence: analysis.confidence,
          ethics_flags: analysis.ethicsFlags,
          xai_data: analysis.xaiData,
          metadata: {
            provider,
            generatedBy: userId,
            generatedAt: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (error) {
        console.error('Database error storing summary:', error)
        throw new Error('Failed to save analysis results')
      }

      return this.transformDatabaseSummary(summary, analysis.researchGaps)
    } catch (error) {
      console.error('Error processing identifier:', error)
      throw error
    }
  }

  private static transformDatabaseSummary(dbSummary: any, researchGaps?: any[]): Summary {
    return {
      id: dbSummary.id,
      paperId: dbSummary.paper_id,
      content: dbSummary.content,
      keyPoints: dbSummary.key_points.map((kp: any, index: number) => ({
        id: `kp-${dbSummary.id}-${index}`,
        ...kp
      })),
      limitations: dbSummary.limitations,
      citations: dbSummary.citations.map((c: any, index: number) => ({
        id: `c-${dbSummary.id}-${index}`,
        ...c
      })),
      confidence: dbSummary.confidence,
      generatedAt: new Date(dbSummary.created_at),
      ethicsFlags: dbSummary.ethics_flags.map((ef: any, index: number) => ({
        id: `ef-${dbSummary.id}-${index}`,
        ...ef
      })),
      xaiData: dbSummary.xai_data,
      researchGaps: researchGaps || []
    }
  }

  static async submitFeedback(summaryId: string, feedback: {
    rating: number
    helpful: boolean
    accuracy: number
    comments?: string
  }): Promise<void> {
    try {
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';

      const { error } = await supabase
        .from('user_feedback')
        .insert({
          summary_id: summaryId,
          rating: feedback.rating,
          helpful: feedback.helpful,
          accuracy: feedback.accuracy,
          comments: feedback.comments,
          user_id: userId
        })

      if (error) {
        console.error('Database error submitting feedback:', error)
        throw new Error('Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      throw error instanceof Error ? error : new Error('Unknown error occurred while submitting feedback')
    }
  }

  static async submitUsageDeclaration(summaryId: string, declaration: {
    intendedUse: string
    customUse?: string
    acknowledgement: boolean
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_usage_declarations')
        .insert({
          summary_id: summaryId,
          intended_use: declaration.intendedUse,
          custom_use: declaration.customUse,
          acknowledgement: declaration.acknowledgement,
        })

      if (error) {
        console.error('Database error submitting declaration:', error)
        throw new Error('Failed to submit usage declaration')
      }
    } catch (error) {
      console.error('Error submitting usage declaration:', error)
      throw error instanceof Error ? error : new Error('Unknown error occurred while submitting declaration')
    }
  }

  // New methods for authenticated users
  static async getUserPapers(): Promise<Paper[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: papers, error } = await supabase
        .from('papers')
        .select('*')
        .eq('metadata->>uploadedBy', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return papers.map(paper => ({
        id: paper.id,
        title: paper.title,
        authors: paper.authors,
        doi: paper.doi,
        url: paper.url,
        content: paper.content,
        metadata: paper.metadata
      }));
    } catch (error) {
      console.error('Error fetching user papers:', error);
      throw error;
    }
  }

  static async getUserSummaries(): Promise<Summary[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: summaries, error } = await supabase
        .from('summaries')
        .select(`
          *,
          papers (*)
        `)
        .eq('metadata->>generatedBy', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return summaries.map(summary => this.transformDatabaseSummary(summary));
    } catch (error) {
      console.error('Error fetching user summaries:', error);
      throw error;
    }
  }

  // Helper methods
  private static extractTitleFromFilename(filename: string): string {
    return filename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
      .replace(/\b\w/g, l => l.toUpperCase()) // Title case
  }

  private static isValidUrl(string: string): boolean {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }
}