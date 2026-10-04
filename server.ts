import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));

const apiKey = 
  process.env.GEMINI_API_KEY || 
  process.env.API_KEY || 
  process.env.VITE_GEMINI_API_KEY || 
  '';

const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

// Helper: Server-side retry
const generateWithRetry = async (options: any, retries = 3) => {
  let lastError: any = null;
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent(options);
    } catch (error: any) {
      lastError = error;
      const isRateLimit = 
        error?.status === 429 || 
        error?.code === 429 || 
        error?.message?.includes('429') || 
        error?.message?.includes('quota') || 
        error?.message?.includes('RESOURCE_EXHAUSTED');

      if (isRateLimit && i < retries - 1) {
        const delayMs = (i + 1) * 1500;
        console.warn(`Server Gemini quota limit. Retrying attempt ${i + 1}/${retries} in ${delayMs}ms...`);
        await new Promise(res => setTimeout(res, delayMs));
        continue;
      }
      throw error;
    }
  }
  throw lastError || new Error("Gemini request failed after retries");
};

// Server-side proxy for Gemini API
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const { model = 'gemini-3.8-flash', contents, config } = req.body;
    if (!contents) {
      return res.status(400).json({ success: false, error: 'Contents is required' });
    }

    const response = await generateWithRetry({
      model,
      contents,
      config
    });

    res.json({
      success: true,
      text: response.text || ''
    });
  } catch (error: any) {
    console.error('Server Gemini Error:', error?.message || error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Gemini API Error'
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
