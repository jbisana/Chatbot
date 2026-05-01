const express = require('express');
const path = require('path');
const crypto = require('crypto');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'fallback-secret-replace-me';

// Security Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "connect-src": ["'self'", N8N_WEBHOOK_URL].filter(Boolean),
        },
    },
}));

app.use(cors());

// Rate Limiting: 20 requests per minute per IP
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 20,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Use raw body for HMAC verification if needed, but for now we'll use json
app.use(express.json());

// HMAC Verification Middleware
const verifyHMAC = (req, res, next) => {
    const signature = req.headers['x-signature-256'];
    if (!signature) {
        return res.status(401).json({ error: 'Missing signature' });
    }

    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');

    if (signature !== digest) {
        return res.status(401).json({ error: 'Invalid signature' });
    }
    next();
};

// API Endpoint for Chat
app.post('/api/chat', limiter, verifyHMAC, async (req, res) => {
    const { session_id, message, metadata } = req.body;

    // Basic Validation
    if (!message || typeof message !== 'string') {
        return res.status(422).json({ error: 'Invalid message format' });
    }

    // Prompt Injection Prevention (Basic)
    const injectionPatterns = [/ignore previous instructions/i, /you are now/i, /system:/i];
    if (injectionPatterns.some(pattern => pattern.test(message))) {
        return res.status(400).json({ error: 'Potential prompt injection detected' });
    }

    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Optional: Add authentication for n8n here
                // 'X-N8N-API-KEY': process.env.N8N_API_KEY 
            },
            body: JSON.stringify({
                session_id,
                message: `<user_message>${message}</user_message>`,
                metadata: {
                    ...metadata,
                    timestamp: Date.now(),
                    ip_hashed: crypto.createHash('sha256').update(req.ip).digest('hex')
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `n8n responded with ${response.status}`);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ error: 'Failed to communicate with AI engine' });
    }
});

// Serve Static Files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    if (!N8N_WEBHOOK_URL) {
        console.warn('WARNING: N8N_WEBHOOK_URL is not defined!');
    }
});
