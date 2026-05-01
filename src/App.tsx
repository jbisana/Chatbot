import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Trash2, Download, Share, Menu, X, MessageSquare, PanelRightOpen, PanelRightClose, Copy, Check, Bot, RefreshCcw, Search } from 'lucide-react';
import { useChat } from './hooks/useChat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MessageBubble = ({ m, i }: { m: any, i: number }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(m.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div 
            key={i}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`flex w-full mx-auto gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
            {m.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-zinc-200 border border-zinc-200 flex flex-shrink-0 items-center justify-center mt-1">
                    <Bot size={16} className="text-zinc-600" />
                </div>
            )}
            <div className={`flex flex-col w-full md:max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`group relative px-5 py-4 w-full text-sm leading-relaxed ${m.role === 'user' ? 'bg-zinc-900 text-white rounded-lg rounded-tr-sm' : 'bg-zinc-100 text-zinc-800 rounded-lg rounded-tl-sm'}`}>
                    {m.role === 'model' && (
                        <button 
                            onClick={handleCopy}
                            className="absolute right-2 top-2 p-1.5 rounded-md bg-white/50 hover:bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-900 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm"
                            title="Copy message"
                        >
                            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                    )}
                    <div className="markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                    </div>
                </div>
                <span className="text-[11px] text-zinc-400 mt-1.5 px-1 font-medium">
                    {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
            </div>
        </motion.div>
    );
};

const ControlsArea = ({ 
    messagesLength, 
    searchQuery, 
    setSearchQuery, 
    shareChat, 
    exportChat, 
    clearChat, 
    isLoading, 
    className = '' 
}: { 
    messagesLength: number;
    searchQuery: string;
    setSearchQuery: (v: string) => void;
    shareChat: () => void;
    exportChat: () => void;
    clearChat: () => void;
    isLoading: boolean;
    className?: string;
}) => (
    <div className={`flex flex-col h-full bg-transparent p-8 justify-between ${className}`}>
        <div className="flex-1 flex flex-col">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-6">Session Controls</h2>
            
            <div className="bg-white border border-zinc-200 p-4 rounded-xl mb-8">
                <div className="flex justify-between items-center mb-2 text-xs">
                    <span className="text-zinc-500">Messages</span>
                    <span className="font-semibold text-zinc-900">{messagesLength}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Model</span>
                    <span className="font-semibold text-zinc-900">Flash Preview</span>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <div className="relative mb-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search history..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-900 placeholder-zinc-500 focus:outline-none focus:border-zinc-300 transition-colors"
                    />
                </div>
                
                <button 
                    onClick={shareChat}
                    disabled={messagesLength === 0}
                    className="flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium transition-all w-full bg-transparent border border-zinc-200 text-zinc-800 hover:bg-zinc-100 disabled:opacity-50"
                >
                    <Share size={16} />
                    Share Conversation
                </button>
                
                <button 
                    onClick={exportChat}
                    disabled={messagesLength === 0}
                    className="flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium transition-all w-full bg-transparent border border-zinc-200 text-zinc-800 hover:bg-zinc-100 disabled:opacity-50"
                >
                    <Download size={16} />
                    Export as .TXT
                </button>
            </div>
        </div>

        <div className="mt-8 flex flex-col gap-4">
            <button 
                onClick={clearChat}
                className="flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium transition-all w-full bg-transparent border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
            >
                <Trash2 size={16} />
                Clear History
            </button>
            <div className="flex items-center gap-2 mt-4 justify-center">
                <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-zinc-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                <span className="text-xs font-medium text-zinc-500">
                    {isLoading ? "Generating response..." : "System ready"}
                </span>
            </div>
        </div>
    </div>
);

function App() {
    const { messages, isLoading, error, sendMessage, retryLastMessage, clearChat, exportChat, shareChat } = useChat();
    const [input, setInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const filteredMessages = useMemo(() => {
        if (!searchQuery.trim()) return messages;
        return messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [messages, searchQuery]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        sendMessage(input);
        setInput('');
    };

    return (
        <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden font-sans bg-zinc-100 text-zinc-900">
            {/* Main Chat Area */}
            <div className={`w-full h-full relative z-0 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'md:w-[75%]' : 'md:w-full'}`}>
                <div className="flex-1 flex flex-col h-full bg-white overflow-hidden border-r border-zinc-200 text-zinc-900">
                    <header className="h-16 px-6 bg-white border-b border-zinc-200 flex justify-between items-center z-10 w-full relative">
                        <div className="flex items-center gap-2">
                            <span className="text-base font-semibold text-zinc-900">AI Assistant</span>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full text-[10px] uppercase font-bold tracking-wider">Active</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-zinc-400 text-xs hidden sm:block">Powered by Gemini</div>
                            <button 
                                className="hidden md:flex p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors focus:outline-none"
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                            >
                                {isSidebarOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
                            </button>
                            <button 
                                className="md:hidden p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors focus:outline-none"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 w-full relative z-0">
                        {messages.length === 0 && !isLoading && (
                            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto opacity-70">
                                <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-6">
                                    <MessageSquare size={32} className="text-zinc-400" />
                                </div>
                                <h2 className="text-xl font-medium text-zinc-800 mb-2 tracking-tight">How can I help you today?</h2>
                                <p className="text-zinc-500 text-sm">Send a message to begin our conversation.</p>
                            </div>
                        )}

                        {searchQuery.trim() && filteredMessages.length === 0 && (
                            <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto opacity-70 mt-12">
                                <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-6">
                                    <Search size={32} className="text-zinc-400" />
                                </div>
                                <h2 className="text-lg font-medium text-zinc-800 mb-2">No messages found</h2>
                                <p className="text-zinc-500 text-sm">We couldn't find any messages matching "{searchQuery}".</p>
                            </div>
                        )}
                        
                        <AnimatePresence initial={false}>
                            {filteredMessages.map((m, i) => (
                                <MessageBubble key={i} m={m} i={i} />
                            ))}
                        </AnimatePresence>

                        {isLoading && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                className="flex w-full mx-auto justify-start gap-4"
                            >
                                <div className="w-8 h-8 rounded-full bg-zinc-200 border border-zinc-200 flex flex-shrink-0 items-center justify-center mt-1">
                                    <Bot size={16} className="text-zinc-500" />
                                </div>
                                <div className="px-5 py-4 w-[60px] rounded-lg rounded-tl-sm bg-zinc-100 text-zinc-800 self-start flex items-center justify-center gap-1.5 h-[52px]">
                                    <motion.div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                                    <motion.div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} />
                                    <motion.div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} />
                                </div>
                            </motion.div>
                        )}
                        
                        {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-start gap-4 max-w-4xl mx-auto shadow-sm">
                                <div className="flex-1 flex flex-col gap-1">
                                    <span className="font-semibold shrink-0">Delivery error</span> 
                                    <span className="break-words">{error}</span>
                                </div>
                                <button 
                                    onClick={retryLastMessage}
                                    className="px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
                                >
                                    <RefreshCcw size={12} /> Retry
                                </button>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>

                    <div className="p-6 bg-white border-t border-zinc-200 relative z-10 w-full flex-shrink-0">
                        <form onSubmit={handleSubmit} className="w-full mx-auto flex gap-3">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message here..."
                                className="flex-1 bg-zinc-100 border border-zinc-200 rounded-lg px-4 py-3 text-sm text-zinc-900 placeholder-zinc-500 focus:outline-none focus:border-zinc-300 transition-colors"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="bg-zinc-900 text-white border-none px-6 py-3 rounded-lg font-medium text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
                            >
                                <span className="hidden sm:inline mr-2">Send</span>
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Desktop Controls */}
            <AnimatePresence initial={false}>
                {isSidebarOpen && (
                    <motion.div 
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: '25%', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                        className="hidden md:block h-full relative z-10 border-l border-zinc-200 bg-zinc-50 overflow-hidden shrink-0"
                    >
                        <div className="w-[100vw] max-w-[25vw] h-full min-w-[250px]">
                            <ControlsArea 
                                messagesLength={messages.length}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                shareChat={shareChat}
                                exportChat={exportChat}
                                clearChat={clearChat}
                                isLoading={isLoading}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Controls Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-40 md:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                            className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-zinc-50 shadow-2xl z-50 md:hidden flex flex-col"
                        >
                            <div className="p-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-100">
                                <span className="font-semibold text-zinc-700">Controls</span>
                                <button 
                                    className="p-2 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 rounded-full focus:outline-none transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <ControlsArea 
                                    className="border-none" 
                                    messagesLength={messages.length}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    shareChat={shareChat}
                                    exportChat={exportChat}
                                    clearChat={clearChat}
                                    isLoading={isLoading}
                                />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default App;
