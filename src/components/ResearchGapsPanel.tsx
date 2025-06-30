import React, { useState } from 'react';
import { Lightbulb, TrendingUp, Target, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';

interface ResearchGap {
  gap: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  suggestedApproach: string;
}

interface ResearchGapsPanelProps {
  researchGaps: ResearchGap[];
}

const ResearchGapsPanel: React.FC<ResearchGapsPanelProps> = ({ researchGaps }) => {
  const [expandedGap, setExpandedGap] = useState<number | null>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 border-red-200 text-red-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Target className="h-4 w-4 text-red-500" />;
      case 'medium': return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      default: return <Lightbulb className="h-4 w-4 text-gray-500" />;
    }
  };

  if (researchGaps.length === 0) {
    return (
      <div className="text-center py-8">
        <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Research Gaps Identified</h3>
        <p className="text-gray-600">
          The analysis didn't identify specific research gaps or future work opportunities in this paper.
        </p>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            This could indicate a comprehensive study, or the analysis may benefit from deeper examination of the methodology and conclusions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-blue-900 mb-2 flex items-center">
          <Lightbulb className="h-5 w-5 mr-2" />
          Research Gaps & Future Work
        </h3>
        <p className="text-blue-700 text-sm">
          Identified opportunities for future research, methodological improvements, and areas that could benefit from additional investigation.
        </p>
      </div>

      <div className="grid gap-4">
        {researchGaps.map((gap, index) => (
          <div key={index} className={`border rounded-lg ${getPriorityColor(gap.priority)}`}>
            <button
              onClick={() => setExpandedGap(expandedGap === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center space-x-3">
                {getPriorityIcon(gap.priority)}
                <div>
                  <h4 className="font-medium">{gap.gap}</h4>
                  <p className="text-sm opacity-75 mt-1">{gap.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50 uppercase font-medium">
                  {gap.priority} priority
                </span>
                {expandedGap === index ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </button>

            {expandedGap === index && (
              <div className="px-4 pb-4 border-t border-white border-opacity-20">
                <div className="mt-3">
                  <h5 className="font-medium text-sm mb-2 flex items-center">
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Suggested Approach:
                  </h5>
                  <p className="text-sm opacity-90 bg-white bg-opacity-30 p-3 rounded">
                    {gap.suggestedApproach}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
        <h4 className="font-medium text-purple-900 mb-2">Research Impact Opportunities</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-purple-800 mb-1">High Priority Areas</h5>
            <ul className="text-purple-700 space-y-1">
              {researchGaps.filter(gap => gap.priority === 'high').map((gap, index) => (
                <li key={index} className="flex items-start space-x-1">
                  <span className="text-red-500 mt-1">•</span>
                  <span>{gap.gap}</span>
                </li>
              ))}
              {researchGaps.filter(gap => gap.priority === 'high').length === 0 && (
                <li className="text-purple-600 italic">No high priority gaps identified</li>
              )}
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-purple-800 mb-1">Future Research Directions</h5>
            <ul className="text-purple-700 space-y-1">
              <li>• Replication studies in different contexts</li>
              <li>• Longitudinal validation of findings</li>
              <li>• Cross-cultural generalizability studies</li>
              <li>• Methodological improvements and innovations</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Research Development Guidelines</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Prioritize high-impact gaps that address fundamental questions</li>
          <li>• Consider interdisciplinary approaches for complex problems</li>
          <li>• Ensure adequate resources and methodology for proposed research</li>
          <li>• Build on existing strengths while addressing identified limitations</li>
          <li>• Collaborate with experts in related fields for comprehensive solutions</li>
        </ul>
      </div>
    </div>
  );
};

export default ResearchGapsPanel;