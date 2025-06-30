import React from 'react';
import { Brain, Zap } from 'lucide-react';
import { LLMProvider } from '../services/llm';

interface LLMProviderSelectorProps {
  selectedProvider: LLMProvider;
  onProviderChange: (provider: LLMProvider) => void;
}

const LLMProviderSelector: React.FC<LLMProviderSelectorProps> = ({ 
  selectedProvider, 
  onProviderChange 
}) => {
  const providers = [
    {
      id: 'openai' as LLMProvider,
      name: 'OpenAI GPT-4',
      description: 'Advanced reasoning and comprehensive analysis',
      icon: Brain,
      color: 'blue',
      available: !!import.meta.env.VITE_OPENAI_API_KEY
    },
    {
      id: 'gemini' as LLMProvider,
      name: 'Google Gemini',
      description: 'Fast processing and detailed insights',
      icon: Zap,
      color: 'green',
      available: !!import.meta.env.VITE_GEMINI_API_KEY
    }
  ];

  const availableProviders = providers.filter(p => p.available);

  if (availableProviders.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-amber-600" />
          <div>
            <h3 className="text-sm font-medium text-amber-800">No AI Providers Configured</h3>
            <p className="text-sm text-amber-700 mt-1">
              Please configure OpenAI or Gemini API keys to enable AI analysis. The system will use enhanced fallback analysis.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (availableProviders.length === 1) {
    const provider = availableProviders[0];
    const Icon = provider.icon;
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Icon className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">AI Provider: {provider.name}</h3>
            <p className="text-sm text-blue-700">{provider.description}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Choose AI Provider</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {availableProviders.map((provider) => {
          const Icon = provider.icon;
          const isSelected = selectedProvider === provider.id;
          
          return (
            <button
              key={provider.id}
              onClick={() => onProviderChange(provider.id)}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors text-left ${
                isSelected
                  ? `border-${provider.color}-500 bg-${provider.color}-50 text-${provider.color}-700`
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              <Icon className={`h-5 w-5 ${
                isSelected ? `text-${provider.color}-600` : 'text-gray-500'
              }`} />
              <div className="flex-1">
                <div className="font-medium">{provider.name}</div>
                <div className="text-sm opacity-75">{provider.description}</div>
              </div>
              {isSelected && (
                <div className={`w-2 h-2 rounded-full bg-${provider.color}-500`}></div>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-3">
        Both providers offer high-quality analysis. OpenAI GPT-4 excels at reasoning, while Gemini provides fast, detailed insights.
      </p>
    </div>
  );
};

export default LLMProviderSelector;