import { useState, useCallback } from 'react';
import CryptoJS from 'crypto-js';

// The shared secret should be passed via environment variables during build
const WEBHOOK_SECRET = import.meta.env.VITE_WEBHOOK_SECRET || 'fallback-secret-replace-me';

export type Message = {
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
};

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionId] = useState(() => crypto.randomUUID());

    const sendMessage = async (text: string) => {
        setIsLoading(true);
        setError(null);
        
        const userMessage: Message = { role: 'user', text, timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        
        try {
            const body = {
                session_id: sessionId,
                message: text,
                metadata: {
                    locale: navigator.language,
                    timestamp: Date.now()
                }
            };

            // Generate HMAC signature for the request
            const signature = 'sha256=' + CryptoJS.HmacSHA256(JSON.stringify(body), WEBHOOK_SECRET).toString(CryptoJS.enc.Hex);

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Signature-256': signature
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server responded with ${response.status}`);
            }

            const data = await response.json();
            
            // Handle n8n response format. Assuming { output: "response text" } or similar
            // Adjust based on your n8n workflow output node
            const botText = data.output || data.message || data.text || JSON.stringify(data);

            setMessages(prev => [...prev, { 
                role: 'model', 
                text: botText, 
                timestamp: new Date() 
            }]);

        } catch (e: any) {
            console.error('Chat Error:', e);
            setError(e?.message || 'An error occurred while communicating with the server.');
        } finally {
            setIsLoading(false);
        }
    };

    const retryLastMessage = useCallback(async () => {
        const lastUserIndex = [...messages].reverse().findIndex(m => m.role === 'user');
        if (lastUserIndex === -1) return;
        
        const actualIndex = messages.length - 1 - lastUserIndex;
        const lastUserMsg = messages[actualIndex];
        const textToRetry = lastUserMsg.text;

        setMessages(prev => prev.slice(0, actualIndex));
        await sendMessage(textToRetry);
    }, [messages]);

    const clearChat = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    const exportChat = useCallback(() => {
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
    }, [messages]);

    const shareChat = useCallback(async () => {
        const text = messages.map(m => `${m.role === 'user' ? 'You' : 'AI'}: ${m.text}`).join('\n\n');
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My Chat Session',
                    text: text,
                });
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    fallbackShare(text);
                }
            }
        } else {
            fallbackShare(text);
        }
    }, [messages]);

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
