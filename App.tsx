import React, { useState, useEffect, useCallback } from 'react';
import { ConnectionPanel } from './components/ConnectionPanel';
import { MessageList } from './components/MessageList';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ThemeToggle } from './components/ThemeToggle';
import { fetchModels, sendMessage } from './services/lmStudioService';
import { DEFAULT_BASE_URL, LOCAL_STORAGE_KEYS } from './constants';
import { Message, Model } from './types';

function App() {
  // --- State ---
  const [isDark, setIsDark] = useState(true);
  const [baseUrl, setBaseUrl] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.BASE_URL) || DEFAULT_BASE_URL;
  });
  
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // --- Effects ---

  // Theme Handling
  useEffect(() => {
    const savedTheme = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME);
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, newTheme ? 'dark' : 'light');
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Base URL Persistence
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.BASE_URL, baseUrl);
  }, [baseUrl]);

  // Model Fetching Logic
  const handleFetchModels = useCallback(async () => {
    if (!baseUrl) return;
    setIsLoadingModels(true);
    setConnectionError(null);
    try {
      const fetchedModels = await fetchModels(baseUrl);
      setModels(fetchedModels);
      
      // Auto-select first model if none selected or current selection invalid
      if (fetchedModels.length > 0) {
        if (!selectedModel || !fetchedModels.find(m => m.id === selectedModel)) {
          setSelectedModel(fetchedModels[0].id);
        }
      } else {
        setSelectedModel('');
      }
    } catch (error) {
      setConnectionError((error as Error).message);
      setModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  }, [baseUrl, selectedModel]);

  // Fetch models when Base URL changes (debounced slightly to avoid rapid calls while typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFetchModels();
    }, 800);
    return () => clearTimeout(timer);
  }, [baseUrl, handleFetchModels]);

  // Reset chat when model changes
  useEffect(() => {
    if (messages.length > 0) {
        // Optional: you might want to keep history, but requirements said "When model changes -> reset chat"
        setMessages([]); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel]);


  // --- Handlers ---

  const handleSend = async () => {
    if (!input.trim() || !selectedModel || isSending) return;

    const userMessage: Message = { role: 'user', content: input, timestamp: Date.now() };
    const newHistory = [...messages, userMessage];
    
    setMessages(newHistory);
    setInput('');
    setIsSending(true);

    try {
      const response = await sendMessage(baseUrl, selectedModel, newHistory);
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.choices[0]?.message?.content || "No content returned.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'system',
        content: `Error: ${(error as Error).message}. Ensure LM Studio is running and the model is loaded.`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-background text-zinc-900 dark:text-zinc-100 font-sans selection:bg-green-500/30">
      
      {/* Header / Connection Panel */}
      <ConnectionPanel
        baseUrl={baseUrl}
        setBaseUrl={setBaseUrl}
        models={models}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        onRefreshModels={handleFetchModels}
        isLoadingModels={isLoadingModels}
        connectionError={connectionError}
      />

      {/* Main Content Area */}
      {messages.length === 0 ? (
        <WelcomeScreen />
      ) : (
        <MessageList messages={messages} isLoading={isSending} />
      )}

      {/* Input Area (Sticky Bottom) */}
      <div className="p-4 bg-white dark:bg-background z-10">
        <div className="max-w-3xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedModel ? "Type your prompt here..." : "Select a model to start chatting"}
            disabled={!selectedModel || isSending}
            className="w-full bg-zinc-100 dark:bg-secondary border border-zinc-200 dark:border-zinc-700 rounded-2xl py-4 pl-12 pr-14 text-base focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            autoFocus
          />
          
          {/* Decorative Icon Left */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                 <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
             </svg>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || !selectedModel || isSending}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-500 hover:bg-green-600 text-white p-2 rounded-xl disabled:opacity-0 disabled:scale-90 transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
        <div className="text-center mt-2">
            <span className="text-xs text-zinc-400 dark:text-zinc-600">
                AI can make mistakes. Consider checking important information.
            </span>
        </div>
      </div>

      {/* Floating Theme Toggle */}
      <div className="fixed top-24 right-4 z-50">
        <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
      </div>
    </div>
  );
}

export default App;