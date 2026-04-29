import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Command as Cmd, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export const AICopilot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '¡Hola! Soy Nexus AI, tu copiloto comercial. ¿En qué te puedo ayudar hoy con tus datos del CRM?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userQuery = input.trim();
        setInput('');

        // Add user message and a blank assistant placeholder
        setMessages(prev => [
            ...prev,
            { role: 'user', content: userQuery },
            { role: 'assistant', content: '' }
        ]);

        setIsLoading(true);

        // Stream reader
        api.ai.askCopilotStream(
            userQuery,
            (chunkText) => {
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastIndex = newMessages.length - 1;
                    if (newMessages[lastIndex].role === 'assistant') {
                        newMessages[lastIndex] = {
                            ...newMessages[lastIndex],
                            content: newMessages[lastIndex].content + chunkText
                        };
                    }
                    return newMessages;
                });
            },
            () => {
                setIsLoading(false);
            },
            (errorMsg) => {
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastIndex = newMessages.length - 1;
                    if (newMessages[lastIndex].role === 'assistant') {
                        newMessages[lastIndex] = { role: 'assistant', content: errorMsg };
                    }
                    return newMessages;
                });
                setIsLoading(false);
            }
        );
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                <AnimatePresence>
                    {!isOpen && (
                        <motion.button
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            onClick={() => setIsOpen(true)}
                            className="group relative flex items-center justify-center p-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 ring-4 ring-surface-border/20"
                        >
                            <Bot className="w-6 h-6 animate-pulse" />
                            <div className="absolute inset-0 rounded-full bg-surface-card opacity-0 group-hover:opacity-10 transition-opacity" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
                        className={`fixed ${isExpanded ? 'inset-4 md:inset-10' : 'bottom-6 right-6 w-full max-w-sm h-[550px] sm:w-[400px]'} z-50 flex flex-col glass-card rounded-3xl shadow-2xl overflow-hidden ring-1 ring-surface-border/50`}
                        style={{
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex-shrink-0">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-surface-card/20 rounded-xl backdrop-blur-sm">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Nexus AI</h3>
                                    <p className="text-xs text-indigo-100 opacity-90">Copiloto Enterprise</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="p-2 text-white/70 hover:text-white hover:bg-surface-card/10 rounded-lg transition-colors hidden sm:block"
                                >
                                    {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 text-white/70 hover:text-white hover:bg-surface-card/10 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div
                            className="flex-1 overflow-y-auto p-5 space-y-4 bg-surface-bg/20 glass-blur custom-scrollbar"
                            role="log"
                            aria-live="polite"
                            aria-relevant="additions"
                        >
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm
                      ${msg.role === 'user'
                                                ? 'bg-indigo-600 text-white rounded-tr-sm'
                                                : 'bg-surface-card text-surface-text border border-surface-border rounded-tl-sm'
                                            }`}
                                    >
                                        {msg.role === 'assistant' ? (
                                            <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:bg-surface-muted-bg prose-pre:text-surface-text prose-pre:border prose-pre:border-surface-border prose-a:text-indigo-500">
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            <p className="text-sm leading-relaxed">{msg.content}</p>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-surface-card border border-surface-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center space-x-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                        <span className="text-xs text-surface-muted font-medium">Nexus está analizando...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={endOfMessagesRef} />
                        </div>

                        {/* Input Form */}
                        <form onSubmit={handleSubmit} className="p-4 bg-surface-card border-t border-surface-border flex-shrink-0">
                            <div className="relative flex items-center">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-surface-muted-bg rounded-md text-surface-muted">
                                    <Cmd className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask Nexus (Cmd+K)..."
                                    disabled={isLoading}
                                    aria-label="Nexus AI Input"
                                    autoFocus
                                    className="w-full pl-12 pr-12 py-3 bg-surface-input border border-surface-border rounded-xl text-sm text-surface-text placeholder:text-surface-muted focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[10px] text-center text-surface-muted mt-2 font-medium">
                                Nexus AI by PyCRM - Respuestas generadas automáticamente
                            </p>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
