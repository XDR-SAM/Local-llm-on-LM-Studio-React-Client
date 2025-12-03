import React, { useEffect, useRef, useState } from 'react';
import { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

const ThinkingBlock: React.FC<{ content: string; isComplete: boolean }> = ({ content, isComplete }) => {
  const [isOpen, setIsOpen] = useState(true);

  // Auto-collapse when complete
  useEffect(() => {
    if (isComplete) {
      setIsOpen(false);
    }
  }, [isComplete]);

  return (
    <div className="mb-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <div className="flex items-center gap-2">
            {isComplete ? (
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
            ) : (
                <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{isComplete ? "Thought Process" : "Thinking..."}</span>
        </div>
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-black/20">
            <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400 italic leading-relaxed">
                {content}
            </p>
        </div>
      )}
    </div>
  );
};

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const parseMessageContent = (content: string, isStreaming: boolean) => {
    const thinkRegex = /<think>([\s\S]*?)(?:<\/think>|$)/;
    const match = content.match(thinkRegex);

    if (match) {
        const thoughtContent = match[1];
        const hasCloseTag = content.includes('</think>');
        const mainContent = content.replace(thinkRegex, '').trim();

        return (
            <>
                <ThinkingBlock content={thoughtContent} isComplete={hasCloseTag || (!isStreaming && !mainContent)} />
                {mainContent && (
                    <div className="prose dark:prose-invert prose-sm max-w-none whitespace-pre-wrap leading-relaxed animate-fade-in">
                        {mainContent}
                    </div>
                )}
            </>
        );
    }

    return (
        <div className="prose dark:prose-invert prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
            {content}
        </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
      <div className="max-w-3xl mx-auto space-y-8 pb-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] md:max-w-[85%] rounded-2xl px-5 py-4 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tr-none'
                  : 'bg-transparent text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-tl-none w-full'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="mb-3 flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-green-600 dark:text-green-500">
                            <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
                        </svg>
                   </div>
                   <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">AI Model</span>
                </div>
              )}

              {/* User Images */}
              {msg.images && msg.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {msg.images.map((img, i) => (
                    <img key={i} src={img} alt="Uploaded" className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-zinc-300 dark:border-zinc-700" />
                  ))}
                </div>
              )}

              {/* Message Content with Logic for Thinking Blocks */}
              {msg.role === 'assistant' 
                ? parseMessageContent(msg.content, !!msg.isStreaming)
                : <div className="whitespace-pre-wrap">{msg.content}</div>
              }
            </div>
          </div>
        ))}

        {/* Generic Loading for non-streaming start or connection */}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
             <div className="max-w-[85%] rounded-2xl px-5 py-4 border border-zinc-200 dark:border-zinc-800 bg-transparent rounded-tl-none w-full">
                <div className="flex items-center gap-3">
                     <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-700 border-t-green-500 rounded-full animate-spin"></div>
                     <span className="text-sm text-zinc-500 animate-pulse">Initializing request...</span>
                </div>
             </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};