import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/require-auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { listProductPlatforms, searchProducts } from '../services/product-search.service.js';

const router = Router();
router.use(requireAuth);

const searchSchema = z.object({
  q: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(40).optional(),
  maxPrice: z.coerce.number().positive().max(100000000).optional(),
  currency: z.string().length(3).default('INR').transform(value => value.toUpperCase()),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

router.get('/platforms', (_req, res) => {
  return res.json({
    verifiedOnly: true,
    platforms: listProductPlatforms(),
  });
});

router.get('/search', asyncHandler(async (req, res) => {
  const parsed = searchSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Provide a valid product search query and filters.' });
  }
  const result = await searchProducts({
    query: parsed.data.q,
    category: parsed.data.category,
    maxPrice: parsed.data.maxPrice,
    currency: parsed.data.currency,
    limit: parsed.data.limit,
  });
  return res.json(result);
}));

export default router;
