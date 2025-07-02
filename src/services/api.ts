import { Paper, Summary } from '../types'
import { LLMService, LLMProvider } from './llm'
import { PDFProcessor } from './pdfProcessor'
import { AcademicDatabaseService } from './academicDatabase'
import { supabase } from '../lib/supabase'

export class ApiService {
  static async uploadPaper(file: File): Promise<Paper> {
    try {
      console.log('🔄 Starting PDF upload process...');
      
      // Extract text and metadata from PDF
      const extractionResult = await PDFProcessor.extractTextFromFile(file);
      
      // Extract title and authors
      const title = extractionResult.metadata.title || 
                   PDFProcessor.extractTitleFromText(extractionResult.text) || 
                   this.extractTitleFromFilename(file.name);
      
      const authors = extractionResult.metadata.author ? 
                     [extractionResult.metadata.author] : 
                     PDFProcessor.extractAuthorsFromText(extractionResult.text);

      // Enhanced metadata
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

      // Get current user
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

      // Create paper record
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
        console.error('❌ Database error:', error);
        // Create temporary paper for analysis even if DB save fails
        return {
          id: `temp-${Date.now()}`,
          title,
          authors: authors.length > 0 ? authors : ['Unknown Author'],
          content: extractionResult.text,
          uploadedFile: file,
          metadata: {
            ...enhancedMetadata,
            uploadedBy: userId,
            temporaryId: true,
            dbSaveError: error.message
          }
        };
      }

      console.log('✅ Paper processing completed successfully');

      return {
        id: data.id,
        title: data.title,
        authors: data.authors,
        content: data.content,
        uploadedFile: file,
        metadata: data.metadata
      }
    } catch (error) {
      console.error('❌ Error uploading paper:', error);
      throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
    }
  }

  static async processPaperFromUrl(identifier: string, title?: string): Promise<Paper> {
    try {
      console.log('🔄 Processing paper from identifier:', identifier);
      
      const academicPaper = await AcademicDatabaseService.processPaperFromIdentifier(identifier);
      
      // Get current user
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
      
      const { data, error } = await supabase
        .from('papers')
        .insert({
          title: title || academicPaper.title,
          authors: academicPaper.authors.length > 0 ? academicPaper.authors : ['Unknown Author'],
          url: academicPaper.url,
          doi: academicPaper.doi,
          content: academicPaper.abstract,
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
        console.error('❌ Database error:', error);
        // Create temporary paper even if DB save fails
        return {
          id: `temp-${Date.now()}`,
          title: title || academicPaper.title,
          authors: academicPaper.authors.length > 0 ? academicPaper.authors : ['Unknown Author'],
          url: academicPaper.url,
          doi: academicPaper.doi,
          content: academicPaper.abstract,
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
            uploadedBy: userId,
            temporaryId: true,
            dbSaveError: error.message
          }
        };
      }

      console.log('✅ Paper metadata processing completed successfully');

      return {
        id: data.id,
        title: data.title,
        authors: data.authors,
        url: data.url,
        doi: data.doi,
        content: data.content,
        metadata: data.metadata
      }
    } catch (error) {
      console.error('Error processing paper from identifier:', error)
      throw error instanceof Error ? error : new Error('Unknown error occurred while processing identifier')
    }
  }

  static async generateSummary(paper: Paper, provider: LLMProvider = 'openai'): Promise<Summary> {
    try {
      console.log('🔄 Starting summary generation...');
      
      if (paper.content) {
        return await this.generateSummaryFromContent(paper, paper.content, provider)
      }

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
      
      const analysis = await LLMService.analyzePaper(content, paper.title, provider)

      // Get current user
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
        console.error('❌ Database error saving summary:', error);
        // Create in-memory summary as fallback
        const summary = {
          id: `temp-summary-${Date.now()}`,
          paper_id: paper.id,
          content: analysis.content,
          key_points: analysis.keyPoints,
          limitations: analysis.limitations,
          citations: analysis.citations,
          confidence: analysis.confidence,
          ethics_flags: analysis.ethicsFlags,
          xai_data: analysis.xaiData,
          created_at: new Date().toISOString(),
          metadata: {
            provider,
            generatedBy: userId,
            generatedAt: new Date().toISOString(),
            temporaryId: true,
            dbSaveError: error.message
          }
        };
        return this.transformDatabaseSummary(summary, analysis.researchGaps);
      }

      console.log('✅ Analysis results processing completed successfully');
      return this.transformDatabaseSummary(data, analysis.researchGaps)
    } catch (error) {
      console.error('Error in content analysis:', error)
      throw error
    }
  }

  private static async generateSummaryFromIdentifier(paper: Paper, provider: LLMProvider): Promise<Summary> {
    try {
      let fullTextContent = paper.content || '';

      if (paper.metadata?.pdfUrl && !fullTextContent) {
        try {
          const pdfResponse = await fetch(paper.metadata.pdfUrl);
          if (pdfResponse.ok) {
            const pdfBlob = await pdfResponse.blob();
            const pdfFile = new File([pdfBlob], 'paper.pdf', { type: 'application/pdf' });
            const extractionResult = await PDFProcessor.extractTextFromFile(pdfFile);
            fullTextContent = extractionResult.text;
            
            try {
              await supabase
                .from('papers')
                .update({ content: fullTextContent })
                .eq('id', paper.id);
            } catch (updateError) {
              console.warn('Failed to update paper content in database:', updateError);
            }
          }
        } catch (pdfError) {
          console.warn('Failed to fetch PDF content:', pdfError);
        }
      }

      if (!fullTextContent) {
        fullTextContent = paper.metadata?.abstract || 
                         `Title: ${paper.title}\nAuthors: ${paper.authors.join(', ')}\nJournal: ${paper.metadata?.journal || 'Unknown'}\nPublished: ${paper.metadata?.publishedDate || 'Unknown'}`;
      }

      const analysis = await LLMService.analyzePaper(fullTextContent, paper.title, provider);

      let userId = 'anonymous';
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
        }
      } catch (authError) {
        console.warn('Auth check failed, using anonymous user:', authError);
      }

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
        .single()

      if (error) {
        console.error('Database error storing summary:', error)
        const summary = {
          id: `temp-summary-${Date.now()}`,
          paper_id: paper.id,
          content: analysis.content,
          key_points: analysis.keyPoints,
          limitations: analysis.limitations,
          citations: analysis.citations,
          confidence: analysis.confidence,
          ethics_flags: analysis.ethicsFlags,
          xai_data: analysis.xaiData,
          created_at: new Date().toISOString(),
          metadata: {
            provider,
            generatedBy: userId,
            generatedAt: new Date().toISOString(),
            temporaryId: true,
            dbSaveError: error.message
          }
        };
        return this.transformDatabaseSummary(summary, analysis.researchGaps);
      }

      return this.transformDatabaseSummary(data, analysis.researchGaps)
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

  static async getUserPapers(): Promise<Paper[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user, returning empty array');
        return [];
      }

      console.log('📄 Fetching user papers...');
      const { data: papers, error } = await supabase
        .from('papers')
        .select('*')
        .eq('metadata->>uploadedBy', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user papers:', error);
        return [];
      }

      console.log(`✅ Fetched ${papers?.length || 0} user papers`);
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
      return [];
    }
  }

  static async getUserSummaries(): Promise<Summary[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user, returning empty array');
        return [];
      }

      console.log('📊 Fetching user summaries...');
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
        return [];
      }

      console.log(`✅ Fetched ${summaries?.length || 0} user summaries`);
      return (summaries || []).map(summary => this.transformDatabaseSummary(summary));
    } catch (error) {
      console.error('Error fetching user summaries:', error);
      return [];
    }
  }

  private static extractTitleFromFilename(filename: string): string {
    return filename
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }
}