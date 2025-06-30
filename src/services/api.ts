import { Paper, Summary } from '../types'
import { LLMService, LLMProvider } from './llm'
import { PDFProcessor } from './pdfProcessor'
import { AcademicDatabaseService } from './academicDatabase'
import { supabase } from '../lib/supabase'

export class ApiService {
  static async uploadPaper(file: File): Promise<Paper> {
    try {
      console.log('🔄 Starting PDF upload process...');
      
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

      // Get current user if authenticated - with better error handling
      let userId = 'anonymous';
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user && !error) {
          userId = user.id;
        }
      } catch (authError) {
        console.warn('Auth check failed, using anonymous user:', authError);
      }

      console.log('💾 Saving paper to database...');

      // Create paper record in database with retry logic
      let paper;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          const { data, error } = await supabase
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
            .single();

          if (error) {
            throw error;
          }

          paper = data;
          break;
        } catch (dbError) {
          retryCount++;
          console.error(`Database error (attempt ${retryCount}):`, dbError);
          
          if (retryCount >= maxRetries) {
            throw new Error(`Failed to save paper after ${maxRetries} attempts: ${dbError.message}`);
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      if (!paper) {
        throw new Error('Failed to save paper to database');
      }

      console.log('✅ Paper saved successfully');

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
      
      // Provide more specific error messages
      if (error.message?.includes('Failed to save paper')) {
        throw error; // Re-throw database errors as-is
      } else if (error.message?.includes('PDF')) {
        throw new Error(`PDF processing failed: ${error.message}`);
      } else {
        throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  static async processPaperFromUrl(identifier: string, title?: string): Promise<Paper> {
    try {
      console.log('🔄 Processing paper from identifier:', identifier);
      
      // Use the academic database service to process the identifier
      const academicPaper = await AcademicDatabaseService.processPaperFromIdentifier(identifier);
      
      // Get current user if authenticated
      let userId = 'anonymous';
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
        }
      } catch (authError) {
        console.warn('Auth check failed, using anonymous user:', authError);
      }
      
      console.log('💾 Saving paper metadata to database...');
      
      // Create paper record in database with retry logic
      let paper;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          const { data, error } = await supabase
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
            .single();

          if (error) {
            throw error;
          }

          paper = data;
          break;
        } catch (dbError) {
          retryCount++;
          console.error(`Database error (attempt ${retryCount}):`, dbError);
          
          if (retryCount >= maxRetries) {
            throw new Error(`Failed to save paper after ${maxRetries} attempts: ${dbError.message}`);
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      if (!paper) {
        throw new Error('Failed to save paper information to database');
      }

      console.log('✅ Paper metadata saved successfully');

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
      console.log('🔄 Starting summary generation...');
      
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
      console.log('🤖 Analyzing paper content with AI...');
      
      // Use LLM service for analysis
      const analysis = await LLMService.analyzePaper(content, paper.title, provider)

      // Get current user if authenticated
      let userId = 'anonymous';
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
        }
      } catch (authError) {
        console.warn('Auth check failed, using anonymous user:', authError);
      }

      console.log('💾 Saving analysis results...');

      // Store summary in database with retry logic
      let summary;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          const { data, error } = await supabase
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
            .single();

          if (error) {
            throw error;
          }

          summary = data;
          break;
        } catch (dbError) {
          retryCount++;
          console.error(`Database error saving summary (attempt ${retryCount}):`, dbError);
          
          if (retryCount >= maxRetries) {
            throw new Error(`Failed to save analysis results after ${maxRetries} attempts: ${dbError.message}`);
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      if (!summary) {
        throw new Error('Failed to save analysis results');
      }

      console.log('✅ Analysis results saved successfully');

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
      let userId = 'anonymous';
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
        }
      } catch (authError) {
        console.warn('Auth check failed, using anonymous user:', authError);
      }

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
      let userId = 'anonymous';
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
        }
      } catch (authError) {
        console.warn('Auth check failed, using anonymous user:', authError);
      }

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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user, returning empty array');
        return [];
      }

      const { data: papers, error } = await supabase
        .from('papers')
        .select('*')
        .eq('metadata->>uploadedBy', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user papers:', error);
        throw error;
      }

      return (papers || []).map(paper => ({
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
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  static async getUserSummaries(): Promise<Summary[]> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user, returning empty array');
        return [];
      }

      const { data: summaries, error } = await supabase
        .from('summaries')
        .select(`
          *,
          papers (*)
        `)
        .eq('metadata->>generatedBy', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user summaries:', error);
        throw error;
      }

      return (summaries || []).map(summary => this.transformDatabaseSummary(summary));
    } catch (error) {
      console.error('Error fetching user summaries:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
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