import React, { useState } from 'react';
import { EthicsFlag, EducationalContent } from '../types';
import { Shield, AlertTriangle, Info, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import EducationalTooltip from './EducationalTooltip';

interface EthicsPanelProps {
  ethicsFlags: EthicsFlag[];
}

const EthicsPanel: React.FC<EthicsPanelProps> = ({ ethicsFlags }) => {
  const [expandedFlag, setExpandedFlag] = useState<string | null>(null);

  const educationalContent: EducationalContent[] = [
    {
      id: 'bias-detection',
      topic: 'bias',
      title: 'Understanding Bias in Research',
      content: 'Bias in research can occur through sampling methods, data collection, or interpretation. It\'s important to identify and acknowledge these limitations.',
      type: 'tooltip',
      relatedFlags: ['bias']
    },
    {
      id: 'data-quality',
      topic: 'data-quality',
      title: 'Data Quality Assessment',
      content: 'Data quality issues include small sample sizes, missing data, or unrepresentative populations that may limit generalizability.',
      type: 'tooltip',
      relatedFlags: ['data-quality']
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-200 text-red-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  if (ethicsFlags.length === 0) {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Ethics Issues Detected</h3>
        <p className="text-gray-600">
          The AI analysis didn't identify any significant ethical concerns or bias indicators in this paper.
        </p>
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">
            ✓ No apparent bias in methodology or data collection<br />
            ✓ Adequate sample representation<br />
            ✓ Clear disclosure of limitations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-amber-900 mb-2 flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Ethics and Bias Analysis
        </h3>
        <p className="text-amber-700 text-sm">
          This analysis identifies potential ethical concerns and biases that may affect the research validity or interpretation.
        </p>
      </div>

      <div className="space-y-4">
        {ethicsFlags.map((flag) => (
          <div key={flag.id} className={`border rounded-lg ${getSeverityColor(flag.severity)}`}>
            <button
              onClick={() => setExpandedFlag(expandedFlag === flag.id ? null : flag.id)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center space-x-3">
                {getSeverityIcon(flag.severity)}
                <div>
                  <h4 className="font-medium capitalize">{flag.type.replace('-', ' ')}</h4>
                  <p className="text-sm opacity-75">{flag.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50 uppercase font-medium">
                  {flag.severity}
                </span>
                {expandedFlag === flag.id ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </button>

            {expandedFlag === flag.id && (
              <div className="px-4 pb-4 border-t border-white border-opacity-20">
                <div className="mt-3 space-y-3">
                  <div>
                    <h5 className="font-medium text-sm mb-1">Recommendation:</h5>
                    <p className="text-sm opacity-90">{flag.recommendation}</p>
                  </div>
                  
                  {flag.sourceLocation && (
                    <div>
                      <h5 className="font-medium text-sm mb-1">Source Location:</h5>
                      <p className="text-sm opacity-90">{flag.sourceLocation}</p>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <EducationalTooltip
                      content={educationalContent.find(c => c.relatedFlags?.includes(flag.type)) || educationalContent[0]}
                    />
                    <a 
                      href="#" 
                      className="text-sm underline opacity-75 hover:opacity-100 flex items-center space-x-1"
                    >
                      <span>Learn more about {flag.type}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Ethics Guidelines</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Always acknowledge AI assistance in your research process</li>
          <li>• Verify AI-generated insights with original sources</li>
          <li>• Consider potential biases in both the original research and AI analysis</li>
          <li>• Maintain critical thinking when interpreting AI recommendations</li>
        </ul>
      </div>
    </div>
  );
};

export default EthicsPanel;