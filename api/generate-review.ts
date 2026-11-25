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
  'Begin by mentioning stopping by the store recently.',
  'Begin directly with what stood out most during the visit.',
  'Begin with a casual comment about shopping here.',
  'Begin by highlighting the overall experience in plain words.',
  'Begin by mentioning how easy it was to find what you wanted.',
  'Begin by mentioning the vibe or setup of the place.',
  'Begin with a quick note about the value or service.',
  'Begin with a straightforward recommendation to nearby shoppers.',
];

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
    const shopName = sanitizeShopField(body.shopName, 'this shop');
    const shopDetails = sanitizeShopField(
      body.shopDetails,
      'local retail store'
    );
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

    const angle =
      OPENING_ANGLES[Math.floor(Math.random() * OPENING_ANGLES.length)];

    const languageDirective =
      language === 'hinglish'
        ? 'Write in natural, everyday Hinglish (conversational Hindi written in Roman/English letters mixed naturally with common English words — like how an Indian customer genuinely writes a Google review on their phone). Do NOT use Devanagari script.'
        : 'Write in natural, everyday English as a real local customer typing quickly on their phone.';

    const ratingTone =
      rating === 5
        ? '5 out of 5 stars: warm, genuinely happy, and ready to visit again.'
        : '4 out of 5 stars: genuinely positive and satisfied, grounded and realistic without sounding over-the-top.';

    const systemInstruction = [
      'You write short, authentic Google customer reviews for a local shop.',
      'Strict rules:',
      '- Output ONLY the review text. No title, no intro, no bullet points, no quotes, no hashtags, no emojis.',
      '- Length: exactly 2 to 3 natural sentences, strictly under 45 words total.',
      '- Sound like a real local customer, never like a marketer or copywriter.',
      '- Avoid clichés such as "hidden gem", "one-stop shop", "unparalleled", "elevate", "exceeded expectations", "top-tier", or "must-visit".',
      languageDirective,
    ].join('\n');

    const promptParts = [
      `Shop name: ${shopName}`,
      `What the shop offers: ${shopDetails}`,
      `Customer rating: ${ratingTone}`,
      tags.length > 0
        ? `Specific highlights to weave in naturally: ${tags.join(', ')}`
        : 'Focus naturally on the overall shopping experience and store offerings.',
      `Opening variation instruction: ${angle}`,
    ];

    if (previousReview) {
      promptParts.push(
        `Do NOT start with the same opening phrase or structure as this previous draft: "${previousReview}"`
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
