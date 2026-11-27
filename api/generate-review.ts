import { GoogleGenAI, ThinkingLevel } from '@google/genai';

interface ServerlessRequest {
  method?: string;
  body?: Record<string, unknown> | string;
}

interface ServerlessResponse {
  status(code: number): ServerlessResponse;
  json(payload: unknown): void;
}

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

export default async function handler(
  req: ServerlessRequest,
  res: ServerlessResponse
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
      return;
    }

    const body: Record<string, unknown> =
      typeof req.body === 'string'
        ? JSON.parse(req.body || '{}')
        : (req.body ?? {});

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

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

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
          contents: promptParts.join('\n'),
          config: {
            systemInstruction,
            ...(thinkingLevel ? { thinkingConfig: { thinkingLevel } } : {}),
          },
        });
        const review = cleanReviewText(response.text ?? '');
        if (review) {
          res.status(200).json({ review });
          return;
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
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to generate review.';
    res.status(502).json({
      error: 'Unable to reach Gemini right now.',
      details: message,
    });
  }
}
