import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/require-auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { searchProducts } from '../services/product-search.service.js';

const router = Router();
router.use(requireAuth);

const searchSchema = z.object({
  q: z.string().trim().max(100).default(''),
  category: z.string().trim().min(1).max(40).optional(),
  maxPrice: z.coerce.number().positive().max(100000000).optional(),
  currency: z.string().length(3).default('INR').transform(value => value.toUpperCase()),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

router.get('/search', asyncHandler(async (req, res) => {
  const parsed = searchSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid product search filters.' });
  }
  const products = await searchProducts(parsed.data);
  return res.json({
    query: parsed.data.q,
    provider: 'demo',
    notice: 'Demo catalogue only. Product names and prices are illustrative, not live retailer offers.',
    count: products.length,
    products,
  });
}));

export default router;
