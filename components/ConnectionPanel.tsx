import React from 'react';
import { Model } from '../types';

interface ConnectionPanelProps {
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  models: Model[];
  selectedModel: string;
  setSelectedModel: (id: string) => void;
  onRefreshModels: () => void;
  isLoadingModels: boolean;
  connectionError: string | null;
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
  baseUrl,
  setBaseUrl,
  models,
  selectedModel,
  setSelectedModel,
  onRefreshModels,
  isLoadingModels,
  connectionError,
}) => {
  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/50 backdrop-blur-md p-4 sticky top-0 z-20">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Base URL Input */}
        <div className="flex-1 w-full flex items-center gap-2">
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-500">API URL</span>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://127.0.0.1:1234"
              className={`w-full bg-zinc-100 dark:bg-zinc-900 border ${connectionError ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'} rounded-lg pl-16 pr-10 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all`}
            />
            <button 
              onClick={onRefreshModels}
              disabled={isLoadingModels}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 disabled:opacity-50"
              title="Refresh Models"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${isLoadingModels ? 'animate-spin' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>
        </div>

        {/* Model Selector */}
        <div className="w-full md:w-64 relative">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={models.length === 0}
            className="w-full appearance-none bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="" disabled>
              {models.length === 0 ? (isLoadingModels ? "Loading models..." : "No models found") : "Select a model"}
            </option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.id}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>

      </div>
      
      {/* Error Feedback */}
      {connectionError && (
        <div className="max-w-5xl mx-auto mt-2">
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs px-3 py-1.5 rounded-md flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {connectionError} - Ensure LM Studio server is running and CORS is enabled.
            </div>
        </div>
      )}
    </div>
  );
};