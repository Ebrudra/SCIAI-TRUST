import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      throw new Error('No file provided')
    }

    if (file.type !== 'application/pdf') {
      throw new Error('File must be a PDF')
    }

    // Get file as array buffer
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Enhanced PDF text extraction using a more robust approach
    const extractedData = await extractPDFContent(uint8Array, file.name, file.size)

    return new Response(
      JSON.stringify({ 
        success: true, 
        text: extractedData.text,
        metadata: extractedData.metadata,
        structure: extractedData.structure
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('PDF extraction error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        fallback: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function extractPDFContent(pdfData: Uint8Array, fileName: string, fileSize: number) {
  try {
    // For now, we'll use a simplified extraction approach
    // In production, you'd use a proper PDF parsing library like pdf-parse or similar
    
    // Convert PDF data to text (this is a simplified approach)
    const text = await extractTextFromPDF(pdfData)
    
    // Analyze the extracted text
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length
    const pageCount = estimatePageCount(text)
    
    // Extract metadata from text
    const title = extractTitle(text) || fileName.replace('.pdf', '')
    const authors = extractAuthors(text)
    const abstract = extractAbstract(text)
    const keywords = extractKeywords(text)
    
    // Analyze document structure
    const structure = analyzeStructure(text)
    
    return {
      text: cleanText(text),
      metadata: {
        fileName,
        fileSize,
        title,
        authors,
        abstract,
        keywords,
        pageCount,
        wordCount,
        extractedAt: new Date().toISOString(),
        extractionMethod: 'server-side'
      },
      structure
    }
  } catch (error) {
    throw new Error(`PDF processing failed: ${error.message}`)
  }
}

async function extractTextFromPDF(pdfData: Uint8Array): Promise<string> {
  // This is a simplified text extraction
  // In production, you'd use a proper PDF library
  
  // Convert bytes to string and look for text patterns
  const decoder = new TextDecoder('utf-8', { fatal: false })
  let rawText = decoder.decode(pdfData)
  
  // Extract text between common PDF text markers
  const textMatches = rawText.match(/\(([^)]+)\)/g) || []
  const extractedText = textMatches
    .map(match => match.slice(1, -1)) // Remove parentheses
    .filter(text => text.length > 2 && /[a-zA-Z]/.test(text)) // Filter meaningful text
    .join(' ')
  
  // If we got very little text, try alternative extraction
  if (extractedText.length < 100) {
    // Look for text in different encoding patterns
    const alternativeMatches = rawText.match(/[A-Za-z][A-Za-z\s.,!?;:'"()-]{10,}/g) || []
    return alternativeMatches.join(' ').substring(0, 10000)
  }
  
  return extractedText.substring(0, 50000) // Limit text length
}

function estimatePageCount(text: string): number {
  // Rough estimation: ~250 words per page
  const wordCount = text.split(/\s+/).length
  return Math.max(1, Math.ceil(wordCount / 250))
}

function extractTitle(text: string): string | null {
  // Look for title patterns in the first 500 characters
  const beginning = text.substring(0, 500)
  const lines = beginning.split(/\n+/).map(line => line.trim()).filter(line => line.length > 0)
  
  for (const line of lines.slice(0, 5)) {
    if (line.length > 10 && line.length < 200 && !line.includes('@') && /^[A-Z]/.test(line)) {
      return line
    }
  }
  
  return null
}

function extractAuthors(text: string): string[] {
  // Look for author patterns
  const authorPatterns = [
    /(?:by|author[s]?)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]*)*(?:\s*,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]*)*)*)/i,
    /^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+\s+[A-Z][a-z]+)*)/m
  ]
  
  for (const pattern of authorPatterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1].split(/,\s*/).map(author => author.trim()).slice(0, 5)
    }
  }
  
  return []
}

function extractAbstract(text: string): string | null {
  const abstractMatch = text.match(/\babstract\b\s*:?\s*(.*?)(?=\n\s*\n|\bintroduction\b)/is)
  if (abstractMatch) {
    return abstractMatch[1].trim().substring(0, 1000)
  }
  return null
}

function extractKeywords(text: string): string[] {
  const keywordMatch = text.match(/\bkeywords?\b\s*:?\s*(.*?)(?=\n\s*\n)/is)
  if (keywordMatch) {
    return keywordMatch[1]
      .split(/[,;]/)
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 2)
      .slice(0, 10)
  }
  return []
}

function analyzeStructure(text: string) {
  const lowerText = text.toLowerCase()
  
  return {
    hasAbstract: /\babstract\b/.test(lowerText),
    hasIntroduction: /\bintroduction\b/.test(lowerText),
    hasMethodology: /\b(method|methodology)\b/.test(lowerText),
    hasResults: /\bresults?\b/.test(lowerText),
    hasConclusion: /\bconclusion\b/.test(lowerText),
    hasReferences: /\breferences?\b/.test(lowerText),
    sections: extractSections(text)
  }
}

function extractSections(text: string): string[] {
  // Extract potential section headers
  const lines = text.split('\n')
  const sections = lines
    .filter(line => {
      const trimmed = line.trim()
      return trimmed.length > 3 && 
             trimmed.length < 100 && 
             /^[A-Z]/.test(trimmed) &&
             !trimmed.includes('.')
    })
    .slice(0, 15)
  
  return sections
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?;:()\-'"]/g, '')
    .trim()
}