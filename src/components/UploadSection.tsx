import React, { useState, useCallback } from 'react';
import { Upload, FileText, Link, AlertCircle, CheckCircle, FileCheck, Search, BookOpen, ExternalLink, X } from 'lucide-react';
import { Paper } from '../types';
import { ApiService } from '../services/api';

interface UploadSectionProps {
  onPaperSubmit: (paper: Paper) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onPaperSubmit }) => {
  const [inputMethod, setInputMethod] = useState<'upload' | 'identifier'>('upload');
  const [identifier, setIdentifier] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [extractionProgress, setExtractionProgress] = useState<{
    stage: string;
    details?: string;
    completed: boolean;
    error?: boolean;
  } | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      handleFileUpload(pdfFile);
    } else {
      alert('Please drop a PDF file');
    }
  }, []);

  const resetProgress = () => {
    console.log('🔄 Resetting upload progress state');
    setExtractionProgress(null);
    setIsProcessing(false);
    setProcessingStage('');
  };

  const handleFileUpload = async (file: File) => {
    console.log('🔄 Starting file upload process...');
    setIsProcessing(true);
    setProcessingStage('Preparing file...');
    
    try {
      // Validate file
      if (!file.type.includes('pdf')) {
        throw new Error('Please select a PDF file');
      }

      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File size too large. Please use a file smaller than 50MB');
      }

      // Show progress stages
      setExtractionProgress({
        stage: 'Validating PDF file',
        details: `Processing ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
        completed: false
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      setExtractionProgress({
        stage: 'Extracting text content',
        details: 'Using PDF.js to extract readable text and metadata...',
        completed: false
      });

      // Process the PDF
      let paper;
      try {
        console.log('📤 Calling ApiService.uploadPaper...');
        paper = await ApiService.uploadPaper(file);
        console.log('✅ ApiService.uploadPaper completed:', paper);
      } catch (processingError) {
        console.error('❌ PDF processing error:', processingError);
        
        setExtractionProgress({
          stage: 'Processing failed',
          details: processingError.message || 'Failed to extract text from PDF',
          completed: false,
          error: true
        });

        setTimeout(() => {
          resetProgress();
        }, 3000);
        return;
      }

      // Show completion
      console.log('✅ Setting completion state...');
      setExtractionProgress({
        stage: 'Analysis complete',
        details: `Successfully extracted ${paper.metadata?.wordCount || 'unknown'} words from ${paper.metadata?.pageCount || 'unknown'} pages`,
        completed: true
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('🚀 Submitting paper to parent component...');
      
      // Reset state BEFORE calling onPaperSubmit
      resetProgress();
      
      // Submit the paper
      onPaperSubmit(paper);
      
      console.log('✅ File upload process completed successfully');

    } catch (error) {
      console.error('❌ Error in handleFileUpload:', error);
      
      setExtractionProgress({
        stage: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        completed: false,
        error: true
      });

      setTimeout(() => {
        resetProgress();
      }, 3000);
    }
  };

  const handleIdentifierSubmit = async () => {
    if (!identifier.trim()) return;
    
    console.log('🔄 Starting identifier submission...');
    setIsProcessing(true);
    setProcessingStage('Processing identifier...');
    
    try {
      setExtractionProgress({
        stage: 'Analyzing identifier',
        details: 'Determining identifier type (DOI, ArXiv, PubMed, URL)...',
        completed: false
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      setExtractionProgress({
        stage: 'Fetching metadata',
        details: 'Retrieving paper information from academic databases...',
        completed: false
      });

      const paper = await ApiService.processPaperFromUrl(identifier);

      setExtractionProgress({
        stage: 'Metadata retrieved',
        details: `Found: "${paper.title}" by ${paper.authors.join(', ')}`,
        completed: true
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Reset state BEFORE calling onPaperSubmit
      resetProgress();
      setIdentifier('');
      
      onPaperSubmit(paper);
      
      console.log('✅ Identifier submission completed successfully');

    } catch (error) {
      console.error('❌ Error processing identifier:', error);
      
      setExtractionProgress({
        stage: 'Processing failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        completed: false,
        error: true
      });

      setTimeout(() => {
        resetProgress();
      }, 3000);
    }
  };

  const getIdentifierPlaceholder = () => {
    return "Enter DOI, ArXiv ID, PubMed ID, or URL:\n• DOI: 10.1000/example\n• ArXiv: 2301.12345 or cs.AI/0123456\n• PubMed: 12345678\n• URL: https://arxiv.org/abs/2301.12345";
  };

  const getIdentifierExamples = () => [
    { type: 'DOI', example: '10.1038/nature12373', description: 'Digital Object Identifier' },
    { type: 'ArXiv', example: '2301.12345', description: 'ArXiv preprint server' },
    { type: 'PubMed', example: '23456789', description: 'PubMed database ID' },
    { type: 'URL', example: 'https://arxiv.org/abs/2301.12345', description: 'Direct paper URL' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Submit Research Paper</h2>
        <p className="text-sm text-gray-600">Upload a PDF or provide a DOI/URL to generate an AI-powered summary with ethical analysis.</p>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setInputMethod('upload')}
          disabled={isProcessing}
          className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-colors ${
            inputMethod === 'upload'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Upload className="h-4 w-4 mx-auto mb-1" />
          Upload PDF
        </button>
        <button
          onClick={() => setInputMethod('identifier')}
          disabled={isProcessing}
          className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-colors ${
            inputMethod === 'identifier'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Search className="h-4 w-4 mx-auto mb-1" />
          DOI/ArXiv/URL
        </button>
      </div>

      {inputMethod === 'upload' ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${isProcessing ? 'pointer-events-none opacity-75' : ''}`}
          onDragEnter={!isProcessing ? handleDrag : undefined}
          onDragLeave={!isProcessing ? handleDrag : undefined}
          onDragOver={!isProcessing ? handleDrag : undefined}
          onDrop={!isProcessing ? handleDrop : undefined}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center">
              {extractionProgress ? (
                <div className="w-full max-w-md">
                  <div className="flex items-center justify-center mb-4">
                    {extractionProgress.error ? (
                      <div className="relative">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                        <button
                          onClick={resetProgress}
                          className="absolute -top-1 -right-1 p-1 bg-red-100 rounded-full hover:bg-red-200"
                          title="Close"
                        >
                          <X className="h-3 w-3 text-red-600" />
                        </button>
                      </div>
                    ) : extractionProgress.completed ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    )}
                  </div>
                  <h3 className={`text-lg font-medium mb-2 ${
                    extractionProgress.error ? 'text-red-900' : 'text-gray-900'
                  }`}>
                    {extractionProgress.stage}
                  </h3>
                  {extractionProgress.details && (
                    <p className={`text-sm mb-4 ${
                      extractionProgress.error ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {extractionProgress.details}
                    </p>
                  )}
                  {!extractionProgress.error && (
                    <div className="bg-gray-200 rounded-full h-2 mb-4">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          extractionProgress.completed ? 'bg-green-500 w-full' : 'bg-blue-600 w-2/3'
                        }`}
                      ></div>
                    </div>
                  )}
                  {extractionProgress.completed && !extractionProgress.error && (
                    <div className="flex items-center justify-center text-sm text-green-600">
                      <FileCheck className="h-4 w-4 mr-2" />
                      <span>PDF processing complete</span>
                    </div>
                  )}
                  {extractionProgress.error && (
                    <div className="mt-4">
                      <button
                        onClick={resetProgress}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">{processingStage}</p>
                </>
              )}
            </div>
          ) : (
            <>
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 mb-2">Drag and drop your PDF here</p>
              <p className="text-sm text-gray-500 mb-4">or click to select a file</p>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
                id="file-upload"
                disabled={isProcessing}
              />
              <label
                htmlFor="file-upload"
                className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors ${
                  isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Select PDF File
              </label>
              <div className="mt-4 text-xs text-gray-500">
                <p>✓ Fast PDF text extraction with optimized processing</p>
                <p>✓ Automatic metadata and structure detection</p>
                <p>✓ Support for complex academic papers (up to 50MB)</p>
                <p>✓ Robust error handling and recovery</p>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {isProcessing ? (
            <div className="flex flex-col items-center py-8">
              {extractionProgress ? (
                <div className="w-full max-w-md text-center">
                  <div className="flex items-center justify-center mb-4">
                    {extractionProgress.error ? (
                      <div className="relative">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                        <button
                          onClick={resetProgress}
                          className="absolute -top-1 -right-1 p-1 bg-red-100 rounded-full hover:bg-red-200"
                          title="Close"
                        >
                          <X className="h-3 w-3 text-red-600" />
                        </button>
                      </div>
                    ) : extractionProgress.completed ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    )}
                  </div>
                  <h3 className={`text-lg font-medium mb-2 ${
                    extractionProgress.error ? 'text-red-900' : 'text-gray-900'
                  }`}>
                    {extractionProgress.stage}
                  </h3>
                  {extractionProgress.details && (
                    <p className={`text-sm mb-4 ${
                      extractionProgress.error ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {extractionProgress.details}
                    </p>
                  )}
                  {!extractionProgress.error && (
                    <div className="bg-gray-200 rounded-full h-2 mb-4">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          extractionProgress.completed ? 'bg-green-500 w-full' : 'bg-blue-600 w-2/3'
                        }`}
                      ></div>
                    </div>
                  )}
                  {extractionProgress.completed && !extractionProgress.error && (
                    <div className="flex items-center justify-center text-sm text-green-600">
                      <BookOpen className="h-4 w-4 mr-2" />
                      <span>Paper metadata retrieved</span>
                    </div>
                  )}
                  {extractionProgress.error && (
                    <div className="mt-4">
                      <button
                        onClick={resetProgress}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">{processingStage}</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="paper-identifier" className="block text-sm font-medium text-gray-700 mb-2">
                  Paper Identifier
                </label>
                <textarea
                  id="paper-identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={getIdentifierPlaceholder()}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  disabled={isProcessing}
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Supported Identifier Types
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getIdentifierExamples().map((item) => (
                    <div key={item.type} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.type}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono text-gray-900 break-all">{item.example}</p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleIdentifierSubmit}
                disabled={!identifier.trim() || isProcessing}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {processingStage}
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Fetch Paper Metadata
                  </>
                )}
              </button>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Academic Database Integration
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• CrossRef API for DOI metadata and citations</li>
                  <li>• ArXiv API for preprint papers and abstracts</li>
                  <li>• PubMed API for biomedical literature</li>
                  <li>• Unpaywall API for open access PDF links</li>
                  <li>• Semantic Scholar API for enhanced metadata</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}

      <div className="mt-4 flex items-start space-x-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-md">
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>
          All AI-generated content includes transparency metrics and requires usage disclosure for academic integrity.
          PDF processing is optimized for fast extraction with robust error handling.
        </p>
      </div>
    </div>
  );
};

export default UploadSection;