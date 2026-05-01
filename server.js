import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Capture the raw body so HMAC verification signs the exact bytes the client signed
app.use(express.json({
    verify: (req, _res, buf) => {
        req.rawBody = buf;
    }
}));

// HMAC Verification Middleware
const verifyHMAC = (req, res, next) => {
    const signature = req.headers['x-signature-256'];
    if (!signature) {
        return res.status(401).json({ error: 'Missing signature' });
    }

    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');

    if (signature !== digest) {
        return res.status(401).json({ error: 'Invalid signature' });
    }
    next();
};

// API Endpoint for Chat
app.post('/api/chat', limiter, verifyHMAC, async (req, res) => {
    if (!N8N_WEBHOOK_URL) {
        return res.status(503).json({ error: 'AI engine is not configured' });
    }

    const { session_id, message, metadata } = req.body;

    if (!message || typeof message !== 'string') {
        return res.status(422).json({ error: 'Invalid message format' });
    }

    const injectionPatterns = [/ignore previous instructions/i, /you are now/i, /system:/i];
    if (injectionPatterns.some(pattern => pattern.test(message))) {
        return res.status(400).json({ error: 'Potential prompt injection detected' });
    }

    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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

// Fail fast – the server cannot operate without a valid webhook URL
if (!N8N_WEBHOOK_URL) {
    console.error('FATAL: N8N_WEBHOOK_URL environment variable is not set. Exiting.');
    process.exit(1);
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Forwarding /api/chat → ${N8N_WEBHOOK_URL}`);
});
