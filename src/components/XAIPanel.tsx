import React, { useState } from 'react';
import { XAIData } from '../types';
import { ChevronDown, ChevronRight, Target, TrendingUp, Eye } from 'lucide-react';

interface XAIPanelProps {
  xaiData: XAIData;
}

const XAIPanel: React.FC<XAIPanelProps> = ({ xaiData }) => {
  const [expandedPathway, setExpandedPathway] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Understanding AI Decision Making</h3>
        <p className="text-blue-700 text-sm">
          This panel shows how the AI analyzed and summarized your paper, providing transparency into the decision-making process.
        </p>
      </div>

      {/* Overall Confidence */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <Target className="h-5 w-5 text-blue-600 mr-2" />
          Confidence Breakdown
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{Math.round(xaiData.confidenceBreakdown.overall * 100)}%</div>
            <div className="text-sm text-gray-600">Overall</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{Math.round(xaiData.confidenceBreakdown.keyPoints * 100)}%</div>
            <div className="text-sm text-gray-600">Key Points</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{Math.round(xaiData.confidenceBreakdown.citations * 100)}%</div>
            <div className="text-sm text-gray-600">Citations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{Math.round(xaiData.confidenceBreakdown.limitations * 100)}%</div>
            <div className="text-sm text-gray-600">Limitations</div>
          </div>
        </div>
      </div>

      {/* Decision Pathways */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
          Decision Pathways
        </h4>
        <div className="space-y-3">
          {xaiData.decisionPathways.map((pathway) => (
            <div key={pathway.id} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setExpandedPathway(expandedPathway === pathway.id ? null : pathway.id)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  {expandedPathway === pathway.id ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="font-medium text-gray-900">{pathway.step}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${pathway.confidence * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{Math.round(pathway.confidence * 100)}%</span>
                </div>
              </button>
              
              {expandedPathway === pathway.id && (
                <div className="px-3 pb-3 border-t border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-700 mt-3 mb-3">{pathway.reasoning}</p>
                  <div className="text-xs text-gray-600">
                    <strong>Sources:</strong> {pathway.sources.join(', ')}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Source References */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <Eye className="h-5 w-5 text-purple-600 mr-2" />
          Source References
        </h4>
        <div className="space-y-3">
          {xaiData.sourceReferences.map((ref) => (
            <div key={ref.id} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-900">{ref.location}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-12 bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-purple-600 h-1.5 rounded-full" 
                      style={{ width: `${ref.relevanceScore * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">{Math.round(ref.relevanceScore * 100)}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 italic mb-2">"{ref.originalText}"</p>
              <p className="text-sm text-gray-600">→ {ref.summaryReference}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Attention Weights */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Attention Weights</h4>
        <p className="text-sm text-gray-600 mb-4">
          These highlight which parts of the text the AI focused on most when generating the summary.
        </p>
        <div className="space-y-2">
          {xaiData.attentionWeights.map((weight, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div 
                className="px-2 py-1 rounded text-sm"
                style={{
                  backgroundColor: `rgba(59, 130, 246, ${weight.weight})`,
                  color: weight.weight > 0.5 ? 'white' : 'black'
                }}
              >
                {weight.text}
              </div>
              <span className="text-xs text-gray-500">{weight.relevance}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default XAIPanel;