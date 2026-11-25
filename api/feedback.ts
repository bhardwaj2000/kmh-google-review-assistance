interface ServerlessRequest {
  method?: string;
  body?: Record<string, unknown> | string;
}

interface ServerlessResponse {
  status(code: number): ServerlessResponse;
  json(payload: unknown): void;
}

export default function handler(
  req: ServerlessRequest,
  res: ServerlessResponse
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const body: Record<string, unknown> =
    typeof req.body === 'string'
      ? JSON.parse(req.body || '{}')
      : (req.body ?? {});

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
    res
      .status(400)
      .json({ error: 'Please share a brief note before submitting.' });
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

  res.status(200).json({
    ok: true,
    receivedAt: new Date().toISOString(),
  });
}
