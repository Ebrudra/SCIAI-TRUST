import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { EducationalContent } from '../types';

interface EducationalTooltipProps {
  content: EducationalContent;
}

const EducationalTooltip: React.FC<EducationalTooltipProps> = ({ content }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
      >
        <Info className="h-4 w-4" />
        <span>Learn about {content.topic}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{content.title}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-gray-700 leading-relaxed">{content.content}</p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationalTooltip;