import { Request, Response, NextFunction } from 'express';

// Postgres error codes we can map to a meaningful client error.
const PG_CLIENT_ERRORS: Record<string, [number, string]> = {
  '23505': [409, 'Resource already exists'],          // unique_violation
  '23503': [400, 'Referenced resource does not exist'], // foreign_key_violation
  '23514': [400, 'Value violates a constraint'],      // check_violation
  '22P02': [400, 'Invalid input value'],              // invalid_text_representation
  '22003': [400, 'Numeric value out of range'],       // numeric_value_out_of_range
};

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}

// Express recognizes error middleware by its 4-argument signature.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  if (res.headersSent) {
    res.end();
    return;
  }

  const pg = typeof err?.code === 'string' ? PG_CLIENT_ERRORS[err.code] : undefined;
  if (pg) {
    res.status(pg[0]).json({ error: pg[1] });
    return;
  }

  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Malformed JSON body' });
    return;
  }

  if (typeof err?.message === 'string' && err.message.startsWith('CORS:')) {
    res.status(403).json({ error: 'Origin not allowed' });
    return;
  }

  console.error(`[${req.method} ${req.originalUrl}]`, err);
  res.status(500).json({ error: 'Internal server error' });
}
