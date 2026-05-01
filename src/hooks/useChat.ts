import { useState } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemini-3-flash-preview";

export type Message = {
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
};

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [error, setError] = useState<string | null>(null);

    const initChat = () => {
        const session = ai.chats.create({ model: MODEL });
        setChatSession(session);
        return session;
    }

    const sendMessage = async (text: string) => {
        setIsLoading(true);
        setError(null);
        
        // Add user message immediately
        setMessages(prev => [...prev, { role: 'user', text, timestamp: new Date() }]);
        
        try {
            let session = chatSession;
            if (!session) {
                session = initChat();
            }
            
            const response = await session.sendMessageStream({ message: text });
            
            // Add a placeholder for the model's message
            setMessages(prev => [...prev, { role: 'model', text: '', timestamp: new Date() }]);
            
            let fullText = "";
            for await (const chunk of response) {
                // The correct property per documentation is chunk.text
                if (chunk.text) {
                    fullText += chunk.text;
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        // Update the last message (which belongs to the model)
                        newMsgs[newMsgs.length - 1] = { role: 'model', text: fullText, timestamp: newMsgs[newMsgs.length - 1].timestamp };
                        return newMsgs;
                    });
                }
            }
        } catch (e: any) {
            console.error('Generative AI Error:', e);
            setError(e?.message || 'An error occurred while communicating with the AI.');
        } finally {
            setIsLoading(false);
        }
    };

    const retryLastMessage = async () => {
        const lastUserIndex = [...messages].reverse().findIndex(m => m.role === 'user');
        if (lastUserIndex === -1) return;
        
        const actualIndex = messages.length - 1 - lastUserIndex;
        const lastUserMsg = messages[actualIndex];
        const textToRetry = lastUserMsg.text;

        setMessages(prev => prev.slice(0, actualIndex));
        await sendMessage(textToRetry);
    };

    const clearChat = () => {
        setMessages([]);
        setChatSession(null);
        setError(null);
    };

    const exportChat = () => {
        const text = messages.map(m => `${m.role === 'user' ? 'You' : 'AI'}: ${m.text}`).join('\n\n');
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-history-${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const shareChat = async () => {
        const text = messages.map(m => `${m.role === 'user' ? 'You' : 'AI'}: ${m.text}`).join('\n\n');
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My Chat Session',
                    text: text,
                });
            } catch (err: any) {
                // User may have cancelled or it failed
                if (err.name !== 'AbortError') {
                    fallbackShare(text);
                }
            }
        } else {
            fallbackShare(text);
        }
    };

    const fallbackShare = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert("Chat transcript copied to clipboard!");
        }).catch(() => {
            alert("Failed to copy chat to clipboard.");
        });
    };

    return { 
        messages, 
        isLoading, 
        error, 
        sendMessage, 
        retryLastMessage,
        clearChat, 
        exportChat, 
        shareChat 
    };
}
