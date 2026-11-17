import { Router, Request, Response, NextFunction, RequestHandler } from 'express';

type Handler = (req: any, res: Response, next: NextFunction) => unknown;

/**
 * Express 4 does not forward rejected promises from async handlers to the
 * error middleware — the request just hangs. This wraps a handler so any
 * thrown error / rejection is passed to next(err).
 */
export function wrap(fn: Handler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * A Router whose get/post/put/patch/delete handlers are automatically wrapped
 * with `wrap`, and whose `:id` / `:sid` params must be positive integers.
 */
export function asyncRouter(): Router {
  const router = Router();

  for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
    const original = router[method].bind(router) as (...args: unknown[]) => Router;
    (router as any)[method] = (path: unknown, ...handlers: Handler[]) =>
      original(path, ...handlers.map(h => (typeof h === 'function' ? wrap(h) : h)));
  }

  const requireIntParam = (req: Request, res: Response, next: NextFunction, value: string) => {
    if (!/^[1-9]\d{0,9}$/.test(value)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    next();
  };
  router.param('id', requireIntParam);
  router.param('sid', requireIntParam);

  return router;
}
