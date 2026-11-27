import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const OPENING_ANGLES = [
  'Begin by mentioning what you bought at the store recently.',
  'Begin by mentioning visiting the shop in the Dariyapur or Kadam Kuan area of Patna.',
  'Begin directly with what stood out most during the visit.',
  'Begin with a casual note about the fabric quality or pricing.',
  'Begin by mentioning how easy it was to pick out items for your home.',
  'Begin by highlighting the staff service and collection.',
  'Begin with a straightforward recommendation for shoppers in Patna.',
  'Begin with a quick mention of coming in for home furnishing shopping.',
];

const LOCAL_AREA_CUES = [
  'Dariyapur, Patna',
  'Kadam Kuan, Patna',
  'Nala Road, Patna',
  'Dariyapur near Nala Road, Patna',
  'Patna',
];

const PRODUCT_SEO_KEYWORDS: Record<
  string,
  { english: string[]; hinglish: string[] }
> = {
  Curtains: {
    english: [
      'door and window curtains',
      'designer curtains',
      'blackout curtains',
      'curtain shop',
    ],
    hinglish: [
      'parda',
      'door aur window parda',
      'designer curtains',
      'parda ka dukan',
    ],
  },
  Bedsheets: {
    english: [
      'cotton bedsheets',
      'king size bedsheet',
      'wedding bedsheet set',
      'cotton bedsheet shop',
    ],
    hinglish: [
      'cotton chadar',
      'king size bedsheet',
      'shaadi ka bedsheet set',
      'chadar',
    ],
  },
  'Blankets & Razai': {
    english: [
      'mink blanket',
      'winter quilt',
      'AC comforter',
      'blanket and razai shop',
    ],
    hinglish: [
      'kambal aur razai',
      'mink blanket',
      'winter kambal',
      'AC comforter',
    ],
  },
  'Mattress & Pillows': {
    english: [
      'orthopedic mattress',
      'sleeping pillows',
      'mattress and pillows',
    ],
    hinglish: ['gadda aur takiya', 'orthopedic mattress', 'soft takiya'],
  },
  'Sofa Covers & Doormats': {
    english: [
      'velvet sofa cover',
      'anti-skid doormat',
      'sofa cover and doormats',
      'home furnishing accessories',
    ],
    hinglish: ['velvet sofa cover', 'sofa cover', 'doormat', 'home furnishing'],
  },
  'Wholesale / Bulk': {
    english: [
      'wholesale handloom rates',
      'wholesale bedsheets and curtains',
      'bulk order pricing',
      'wholesale handloom shop',
    ],
    hinglish: [
      'wholesale rate',
      'wholesale handloom dukan',
      'bulk order',
      'sasta wholesale rate',
    ],
  },
};

const DEFAULT_SEO_PRODUCT_ROTATION = {
  english: [
    'curtains and cotton bedsheets',
    'home furnishings and designer curtains',
    'cotton bedsheets and mink blankets',
    'curtains, sofa covers, and doormats',
    'blankets, razai, and pillows',
    'handloom items at wholesale rates',
  ],
  hinglish: [
    'parda aur cotton chadar',
    'kambal aur razai',
    'curtains aur sofa cover',
    'gadda, takiya aur bedsheet',
    'wholesale rate par handloom saman',
  ],
};

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function sanitizeShopField(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  const unwrapped = trimmed.replace(/^\[(.*)\]$/, '$1').trim();
  if (/^your shop name$/i.test(unwrapped)) {
    return 'this shop';
  }
  return unwrapped.replace(/^e\.g\.,?\s*/i, '').trim() || fallback;
}

function cleanReviewText(raw: string): string {
  return raw
    .trim()
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .replace(/#\w+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSeoKeywordHints(
  products: string[],
  language: 'english' | 'hinglish'
): { areaCue: string; productHints: string[] } {
  const areaCue = pickRandom(LOCAL_AREA_CUES);

  if (products.length > 0) {
    const productHints = products.slice(0, 2).map((product) => {
      const bucket = PRODUCT_SEO_KEYWORDS[product];
      if (!bucket) return product.toLowerCase();
      return pickRandom(bucket[language]);
    });
    return { areaCue, productHints };
  }

  return {
    areaCue,
    productHints: [pickRandom(DEFAULT_SEO_PRODUCT_ROTATION[language])],
  };
}

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function generateReviewWithRetry(
  ai: GoogleGenAI,
  systemInstruction: string,
  prompt: string
): Promise<string> {
  const attempts: Array<{ model: string; thinkingLevel?: ThinkingLevel }> = [
    { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW },
    { model: 'gemini-3.1-flash-lite' },
  ];

  let lastError: unknown;
  for (let i = 0; i < attempts.length; i += 1) {
    const { model, thinkingLevel } = attempts[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          ...(thinkingLevel
            ? { thinkingConfig: { thinkingLevel } }
            : {}),
        },
      });
      const text = cleanReviewText(response.text ?? '');
      if (text) {
        return text;
      }
      throw new Error('Empty response returned from Gemini.');
    } catch (error) {
      lastError = error;
      if (i < attempts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.post('/api/generate-review', async (req, res) => {
    try {
      const body = req.body ?? {};
      const rating = Number(body.rating);
      if (rating !== 4 && rating !== 5) {
        res.status(400).json({ error: 'Rating must be 4 or 5.' });
        return;
      }

      const language = body.language === 'hinglish' ? 'hinglish' : 'english';
      const shopName = sanitizeShopField(body.shopName, 'K.M. Handloom');
      const shopDetails = sanitizeShopField(
        body.shopDetails,
        'handloom and home furnishing store in Dariyapur, Patna'
      );
      const products: string[] = Array.isArray(body.products)
        ? body.products
            .filter((p: unknown): p is string => typeof p === 'string')
            .map((p: string) => p.trim())
            .filter(Boolean)
            .slice(0, 6)
        : [];
      const tags: string[] = Array.isArray(body.tags)
        ? body.tags
            .filter((t: unknown): t is string => typeof t === 'string')
            .map((t: string) => t.trim())
            .filter(Boolean)
            .slice(0, 8)
        : [];
      const previousReview =
        typeof body.previousReview === 'string'
          ? body.previousReview.trim().slice(0, 300)
          : '';

      const angle = pickRandom(OPENING_ANGLES);
      const { areaCue, productHints } = buildSeoKeywordHints(products, language);

      const languageDirective =
        language === 'hinglish'
          ? 'Write in natural, everyday Hinglish as spoken in Patna, Bihar (conversational Hindi written in Roman/English letters mixed naturally with everyday English words — like parda, chadar, kambal, razai, gadda, takiya, handloom dukan, wholesale rate). Do NOT use Devanagari script.'
          : 'Write in natural, everyday English as a real local customer in Patna typing quickly on their phone.';

      const ratingTone =
        rating === 5
          ? '5 out of 5 stars: warm, genuinely happy, and ready to recommend or visit again.'
          : '4 out of 5 stars: genuinely positive and satisfied, grounded and realistic without sounding over-the-top.';

      const systemInstruction = [
        'You write short, authentic, local-SEO-friendly Google Maps customer reviews for a retail & wholesale handloom shop in Patna.',
        'Strict rules:',
        '- Output ONLY the review text. No title, no intro, no bullet points, no quotes, no hashtags, no emojis.',
        '- Length: exactly 2 to 3 natural sentences, strictly under 48 words total.',
        '- Local SEO guidance (KEEP IT NATURAL): weave in the shop name OR "handloom shop", 1 natural Patna location cue (such as Dariyapur, Kadam Kuan, Nala Road, or Patna), and the suggested product keyword naturally inside normal human phrasing.',
        '- NEVER keyword-stuff or sound like an advertisement. Sound like a genuine local shopper.',
        '- Avoid clichés such as "hidden gem", "one-stop shop", "unparalleled", "elevate", "exceeded expectations", "top-tier", or "must-visit".',
        languageDirective,
      ].join('\n');

      const promptParts = [
        `Shop name: ${shopName}`,
        `Shop profile: ${shopDetails}`,
        `Customer rating: ${ratingTone}`,
        `Natural product mention to include: ${productHints.join(' and ')}`,
        `Natural local area cue to weave in once: ${areaCue}`,
        tags.length > 0
          ? `Customer highlights to weave in naturally: ${tags.join(', ')}`
          : 'Mention the quality, variety, or fair retail/wholesale pricing naturally.',
        `Opening variation instruction: ${angle}`,
      ];

      if (previousReview) {
        promptParts.push(
          `Do NOT reuse the same opening phrase or sentence flow as this previous draft: "${previousReview}"`
        );
      }

      const ai = getGenAIClient();
      const review = await generateReviewWithRetry(
        ai,
        systemInstruction,
        promptParts.join('\n')
      );

      res.json({ review });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate review.';
      console.error('[api/generate-review] Error:', message);
      res.status(502).json({
        error: 'Unable to reach Gemini right now.',
        details: message,
      });
    }
  });

  app.post('/api/feedback', (req, res) => {
    const body = req.body ?? {};
    const rating = Number(body.rating);
    const comment =
      typeof body.comment === 'string' ? body.comment.trim().slice(0, 2000) : '';
    const name =
      typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
    const phone =
      typeof body.phone === 'string' ? body.phone.trim().slice(0, 40) : '';
    const shopName =
      typeof body.shopName === 'string' ? body.shopName.trim().slice(0, 160) : '';

    if (!Number.isInteger(rating) || rating < 1 || rating > 3) {
      res.status(400).json({ error: 'Private feedback rating must be 1 to 3.' });
      return;
    }
    if (!comment) {
      res.status(400).json({ error: 'Please share a brief note before submitting.' });
      return;
    }

    console.info('[private-feedback]', {
      receivedAt: new Date().toISOString(),
      shopName,
      rating,
      hasName: Boolean(name),
      hasPhone: Boolean(phone),
      commentLength: comment.length,
    });

    res.json({
      ok: true,
      receivedAt: new Date().toISOString(),
    });
  });

  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
