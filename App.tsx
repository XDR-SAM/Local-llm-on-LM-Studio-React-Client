import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ConnectionPanel } from './components/ConnectionPanel';
import { MessageList } from './components/MessageList';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ThemeToggle } from './components/ThemeToggle';
import { fetchModels, sendMessageStream } from './services/lmStudioService';
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
  const [inputImages, setInputImages] = useState<string[]>([]); // Base64 strings
  const [isSending, setIsSending] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Fetch models when Base URL changes
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFetchModels();
    }, 800);
    return () => clearTimeout(timer);
  }, [baseUrl, handleFetchModels]);

  // Reset chat when model changes
  useEffect(() => {
    if (messages.length > 0) {
        setMessages([]); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel]);


  // --- Handlers ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setInputImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              setInputImages(prev => [...prev, reader.result as string]);
            }
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const removeImage = (index: number) => {
    setInputImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && inputImages.length === 0) || !selectedModel || isSending) return;

    const userMessage: Message = { 
        role: 'user', 
        content: input, 
        images: inputImages.length > 0 ? [...inputImages] : undefined,
        timestamp: Date.now() 
    };

    const newHistory = [...messages, userMessage];
    
    setMessages(newHistory);
    setInput('');
    setInputImages([]);
    setIsSending(true);

    // Placeholder for assistant message
    const assistantMessageId = Date.now();
    setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        timestamp: assistantMessageId,
        isStreaming: true
    }]);

    try {
      let fullContent = '';
      
      await sendMessageStream(baseUrl, selectedModel, newHistory, (chunk) => {
        fullContent += chunk;
        setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last.role === 'assistant') {
                return [
                    ...prev.slice(0, -1),
                    { ...last, content: fullContent }
                ];
            }
            return prev;
        });
      });

      // Mark as done streaming
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last.role === 'assistant') {
            return [
                ...prev.slice(0, -1),
                { ...last, isStreaming: false }
            ];
        }
        return prev;
      });

    } catch (error) {
        // Remove empty placeholder if it failed immediately, or append error
        setMessages(prev => {
            const last = prev[prev.length - 1];
            // If we have some content, keep it and append error, otherwise replace
            if (last.content) {
                return [
                    ...prev.slice(0, -1),
                    { ...last, isStreaming: false },
                    { role: 'system', content: `Error: ${(error as Error).message}`, timestamp: Date.now() }
                ];
            } else {
                return [
                    ...prev.slice(0, -1),
                    { role: 'system', content: `Error: ${(error as Error).message}. Ensure LM Studio is running.`, timestamp: Date.now() }
                ];
            }
        });
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
      <div className="p-4 bg-white dark:bg-background z-10 border-t border-zinc-100 dark:border-zinc-800/50">
        <div className="max-w-3xl mx-auto relative flex flex-col gap-2">
          
          {/* Image Previews */}
          {inputImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto py-2">
              {inputImages.map((img, idx) => (
                <div key={idx} className="relative group shrink-0">
                  <img src={img} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700" />
                  <button 
                    onClick={() => removeImage(idx)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
             {/* Hidden File Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="image/*" 
                className="hidden" 
            />

            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={selectedModel ? "Type your prompt here (or paste an image)..." : "Select a model to start chatting"}
                disabled={!selectedModel || isSending}
                className="w-full bg-zinc-100 dark:bg-secondary border border-zinc-200 dark:border-zinc-700 rounded-2xl py-4 pl-12 pr-14 text-base focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                autoFocus
            />
            
            {/* Attachment Button */}
            <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedModel || isSending}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                title="Attach Image"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
            </button>

            {/* Send Button */}
            <button
                onClick={handleSend}
                disabled={(!input.trim() && inputImages.length === 0) || !selectedModel || isSending}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-500 hover:bg-green-600 text-white p-2 rounded-xl disabled:opacity-0 disabled:scale-90 transition-all duration-200"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-3 pb-2">
            <span className="text-xs text-zinc-400 dark:text-zinc-600 block mb-1">
                AI can make mistakes. Consider checking important information.
            </span>
            <span className="text-[10px] text-zinc-300 dark:text-zinc-700 font-medium tracking-wide">
                MADE WITH LOVE BY SAMI
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