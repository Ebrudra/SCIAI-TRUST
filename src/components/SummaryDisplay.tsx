import React, { useState } from 'react';
import { Paper, Summary } from '../types';
import { FileText, Eye, Shield, MessageSquare, Book, Share2, Users, Lightbulb } from 'lucide-react';
import XAIPanel from './XAIPanel';
import EthicsPanel from './EthicsPanel';
import FeedbackPanel from './FeedbackPanel';
import CommentsPanel from './CommentsPanel';
import ResearchGapsPanel from './ResearchGapsPanel';
import DisclosureModal from './DisclosureModal';
import ShareModal from './ShareModal';

interface SummaryDisplayProps {
  paper: Paper;
  summary: Summary;
}

const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ paper, summary }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'xai' | 'ethics' | 'gaps' | 'feedback' | 'comments'>('summary');
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const tabs = [
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'xai', label: 'Explainable AI', icon: Eye },
    { id: 'ethics', label: 'Ethics Analysis', icon: Shield },
    { id: 'gaps', label: 'Research Gaps', icon: Lightbulb },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    { id: 'feedback', label: 'Feedback', icon: Users },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{paper.title}</h2>
            <p className="text-sm text-gray-600 mb-3">
              {paper.authors.join(', ')} • {paper.metadata?.journal} • {paper.metadata?.publishedDate}
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Confidence: {Math.round(summary.confidence * 100)}%</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield className={`h-4 w-4 ${summary.ethicsFlags.length > 0 ? 'text-amber-500' : 'text-green-500'}`} />
                <span className="text-gray-600">
                  {summary.ethicsFlags.length} ethics {summary.ethicsFlags.length === 1 ? 'flag' : 'flags'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Lightbulb className="h-4 w-4 text-blue-500" />
                <span className="text-gray-600">
                  {summary.researchGaps?.length || 0} research {summary.researchGaps?.length === 1 ? 'gap' : 'gaps'}
                </span>
              </div>
              {summary.isShared && (
                <div className="flex items-center space-x-1">
                  <Share2 className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-600">Shared</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
            <button
              onClick={() => setShowDisclosure(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Book className="h-4 w-4" />
              <span>Usage Declaration</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Summary</h3>
              <p className="text-gray-700 leading-relaxed">{summary.content}</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Key Points</h3>
              <div className="space-y-3">
                {summary.keyPoints.map((point) => (
                  <div key={point.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      point.importance === 'high' ? 'bg-red-500' :
                      point.importance === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-gray-700">{point.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Source: {point.sourceSection} • Confidence: {Math.round(point.confidence * 100)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Limitations</h3>
              <ul className="space-y-2">
                {summary.limitations.map((limitation, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span className="text-gray-700">{limitation}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Citations</h3>
              <div className="space-y-3">
                {summary.citations.map((citation) => (
                  <div key={citation.id} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-700 italic">"{citation.text}"</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {citation.sourceLocation} {citation.pageNumber ? `(p. ${citation.pageNumber})` : ''} • 
                      Confidence: {Math.round(citation.confidence * 100)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'xai' && <XAIPanel xaiData={summary.xaiData} />}
        {activeTab === 'ethics' && <EthicsPanel ethicsFlags={summary.ethicsFlags} />}
        {activeTab === 'gaps' && <ResearchGapsPanel researchGaps={summary.researchGaps || []} />}
        {activeTab === 'comments' && <CommentsPanel summaryId={summary.id} />}
        {activeTab === 'feedback' && <FeedbackPanel summaryId={summary.id} />}
      </div>

      {showDisclosure && (
        <DisclosureModal
          summaryId={summary.id}
          onClose={() => setShowDisclosure(false)}
        />
      )}

      {showShareModal && (
        <ShareModal
          summaryId={summary.id}
          paperTitle={paper.title}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};

export default SummaryDisplay;