import React, { useState } from 'react';
import Header from './components/Header';
import Homepage from './components/Homepage';
import UploadSection from './components/UploadSection';
import SummaryDisplay from './components/SummaryDisplay';
import AdminDashboard from './components/AdminDashboard';
import UserHistory from './components/UserHistory';
import WorkspaceManagement from './components/WorkspaceManagement';
import UserProfile from './components/UserProfile';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import LLMProviderSelector from './components/LLMProviderSelector';
import { Paper, Summary } from './types';
import { ApiService } from './services/api';
import { LLMProvider } from './services/llm';
import { useAuth } from './contexts/AuthContext';

type AppView = 'homepage' | 'analysis' | 'admin' | 'history' | 'workspaces' | 'profile' | 'analytics';

function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('homepage');
  const [currentPaper, setCurrentPaper] = useState<Paper | null>(null);
  const [currentSummary, setCurrentSummary] = useState<Summary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('openai');

  const handleGetStarted = () => {
    console.log('🚀 Getting started - navigating to analysis');
    setCurrentView('analysis');
  };

  const handleAdminAccess = () => {
    if (user?.role === 'admin') {
      console.log('👑 Admin access granted');
      setCurrentView('admin');
    }
  };

  const handleNavigate = (view: AppView) => {
    console.log(`🧭 Navigating to: ${view}`);
    setCurrentView(view);
    
    // Clear analysis state when navigating away from analysis
    if (view !== 'analysis') {
      setCurrentPaper(null);
      setCurrentSummary(null);
      setIsProcessing(false);
      setError(null);
    }
  };

  const handleLogoutSuccess = () => {
    console.log('👋 Logout successful, navigating to homepage');
    // Immediately navigate to homepage and clear all state
    setCurrentView('homepage');
    setCurrentPaper(null);
    setCurrentSummary(null);
    setIsProcessing(false);
    setError(null);
  };

  const handlePaperSubmit = async (paper: Paper) => {
    console.log('📄 Paper submitted for analysis:', paper.title);
    setCurrentPaper(paper);
    setIsProcessing(true);
    setError(null);
    
    try {
      console.log(`🤖 Starting AI analysis with ${selectedProvider}...`);
      const summary = await ApiService.generateSummary(paper, selectedProvider);
      console.log('✅ AI analysis completed successfully');
      setCurrentSummary(summary);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('❌ Error processing paper:', err);
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewAnalysis = () => {
    console.log('🔄 Starting new analysis');
    setCurrentPaper(null);
    setCurrentSummary(null);
    setIsProcessing(false);
    setError(null);
  };

  const handleBackToHome = () => {
    console.log('🏠 Returning to homepage');
    setCurrentView('homepage');
    handleNewAnalysis();
  };

  // Show loading spinner while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading SciAI Trust Toolkit</h2>
          <p className="text-gray-600 animate-pulse">Initializing secure authentication...</p>
          <div className="mt-4 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onLogoClick={handleBackToHome} 
        onAdminClick={handleAdminAccess}
        onNavigate={handleNavigate}
        onLogoutSuccess={handleLogoutSuccess}
        currentView={currentView}
        showAdminLink={user?.role === 'admin'}
      />
      
      {currentView === 'homepage' && (
        <Homepage onGetStarted={handleGetStarted} />
      )}

      {currentView === 'admin' && (
        <AdminDashboard />
      )}

      {currentView === 'analytics' && (
        <AdvancedAnalytics />
      )}

      {currentView === 'history' && (
        <UserHistory />
      )}

      {currentView === 'workspaces' && (
        <WorkspaceManagement />
      )}

      {currentView === 'profile' && (
        <UserProfile />
      )}
      
      {currentView === 'analysis' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!currentPaper && !isProcessing && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  AI-Powered Research Analysis
                </h1>
                <p className="text-lg text-gray-600">
                  Upload scientific papers for transparent, ethical AI analysis with built-in bias detection and explainable insights.
                </p>
              </div>
              
              <div className="mb-6">
                <LLMProviderSelector 
                  selectedProvider={selectedProvider}
                  onProviderChange={setSelectedProvider}
                />
              </div>
              
              <UploadSection onPaperSubmit={handlePaperSubmit} />
            </div>
          )}

          {isProcessing && (
            <div className="max-w-2xl mx-auto text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Your Paper</h2>
              <p className="text-gray-600 mb-4">
                Our AI is processing the content with ethics analysis and transparency features using {selectedProvider === 'openai' ? 'OpenAI GPT-4' : 'Google Gemini'}...
              </p>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Extracting text content</span>
                  <span className="text-green-600">✓</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
                  <span>Generating AI summary with {selectedProvider === 'openai' ? 'OpenAI' : 'Gemini'}</span>
                  <div className="animate-pulse w-4 h-4 bg-blue-400 rounded-full"></div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
                  <span>Running ethics analysis</span>
                  <span className="text-gray-400">◦</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
                  <span>Building transparency report</span>
                  <span className="text-gray-400">◦</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
                  <span>Identifying research gaps</span>
                  <span className="text-gray-400">◦</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error Processing Paper</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={handleNewAnalysis}
                        className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentPaper && currentSummary && !isProcessing && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Analysis Complete</h2>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Analyzed with {selectedProvider === 'openai' ? 'OpenAI GPT-4' : 'Google Gemini'}
                  </span>
                  <button
                    onClick={handleNewAnalysis}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Analyze New Paper
                  </button>
                </div>
              </div>
              <SummaryDisplay paper={currentPaper} summary={currentSummary} />
            </div>
          )}
        </main>
      )}

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              SciAI Trust Toolkit - Promoting ethical AI use in research
            </p>
            <p>
              Built with transparency, accountability, and academic integrity in mind.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;