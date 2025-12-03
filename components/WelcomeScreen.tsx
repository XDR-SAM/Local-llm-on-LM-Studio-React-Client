import React from 'react';
import { WELCOME_CARDS, CATEGORY_FILTERS } from '../constants';

export const WelcomeScreen: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in">
        <div className="mb-8 relative">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4 mx-auto backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-green-500">
                    <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
                </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold text-center text-zinc-900 dark:text-white mb-2 tracking-tight">
                How can I help you today?
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-center max-w-lg mx-auto text-sm">
                This client connects directly to your local LM Studio instance. Your data stays on your machine.
            </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mb-8">
            {WELCOME_CARDS.map((card, idx) => (
                <div key={idx} className="group p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-default">
                    <div className="mb-2 text-green-600 dark:text-green-500">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                        </svg>
                    </div>
                    <h3 className="font-medium text-zinc-900 dark:text-white mb-1">{card.title}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{card.description}</p>
                </div>
            ))}
        </div>

        {/* Category Filters (Visual Only as per image design) */}
        <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {CATEGORY_FILTERS.map((filter, idx) => (
                <span key={idx} className={`cursor-pointer transition-colors hover:text-green-500 ${idx === 0 ? 'text-green-600 dark:text-green-500' : ''}`}>
                    {filter}
                </span>
            ))}
        </div>
    </div>
  );
};