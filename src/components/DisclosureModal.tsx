import React, { useState } from 'react';
import { X, Book, AlertCircle, CheckCircle } from 'lucide-react';
import { AIUsageDeclaration } from '../types';

interface DisclosureModalProps {
  summaryId: string;
  onClose: () => void;
}

const DisclosureModal: React.FC<DisclosureModalProps> = ({ summaryId, onClose }) => {
  const [declaration, setDeclaration] = useState<Partial<AIUsageDeclaration>>({
    summaryId,
    intendedUse: 'internal-understanding',
    acknowledgement: false
  });
  const [submitted, setSubmitted] = useState(false);

  const usageOptions = [
    {
      id: 'internal-understanding',
      label: 'Internal Understanding',
      description: 'Using the summary to better understand the paper for personal research purposes'
    },
    {
      id: 'literature-review',
      label: 'Literature Review',
      description: 'Incorporating insights into a literature review or research synthesis'
    },
    {
      id: 'draft-writing',
      label: 'Draft Writing',
      description: 'Using content as a basis for writing academic papers or reports'
    },
    {
      id: 'research-planning',
      label: 'Research Planning',
      description: 'Informing future research directions or methodology decisions'
    },
    {
      id: 'other',
      label: 'Other',
      description: 'Different intended use (please specify)'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!declaration.acknowledgement) return;
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitted(true);
    
    // Close modal after a delay
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Book className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">AI Usage Declaration</h2>
          </div>
          {!submitted && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Declaration Recorded</h3>
              <p className="text-gray-600">
                Your usage declaration has been saved for transparency and academic integrity.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900">Academic Integrity Notice</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      This declaration ensures transparency about AI use in research and helps maintain 
                      academic integrity standards. Please specify how you intend to use this AI-generated content.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  How do you intend to use this AI-generated summary?
                </label>
                <div className="space-y-3">
                  {usageOptions.map((option) => (
                    <label key={option.id} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="intendedUse"
                        value={option.id}
                        checked={declaration.intendedUse === option.id}
                        onChange={(e) => setDeclaration(prev => ({ 
                          ...prev, 
                          intendedUse: e.target.value as any 
                        }))}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {declaration.intendedUse === 'other' && (
                <div>
                  <label htmlFor="custom-use" className="block text-sm font-medium text-gray-700 mb-2">
                    Please specify your intended use:
                  </label>
                  <textarea
                    id="custom-use"
                    rows={3}
                    value={declaration.customUse || ''}
                    onChange={(e) => setDeclaration(prev => ({ ...prev, customUse: e.target.value }))}
                    placeholder="Describe how you plan to use this AI-generated content..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-medium text-amber-900 mb-2">Important Responsibilities</h4>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• You remain fully responsible for verifying all AI-generated content</li>
                  <li>• Always cite and acknowledge AI assistance in your work</li>
                  <li>• Cross-reference AI insights with original sources</li>
                  <li>• Maintain critical evaluation of all AI-generated summaries and analyses</li>
                </ul>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="acknowledgement"
                  checked={declaration.acknowledgement}
                  onChange={(e) => setDeclaration(prev => ({ ...prev, acknowledgement: e.target.checked }))}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="acknowledgement" className="text-sm text-gray-700">
                  I understand my responsibilities when using AI-generated content and commit to maintaining 
                  academic integrity, proper attribution, and critical evaluation of all AI outputs.
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!declaration.acknowledgement}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Declaration
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DisclosureModal;