// Phase 3 — ATLAS AI Integration
// src/routes/atlasMarketRoutes.ts

import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { authMiddleware } from '../middleware/authMiddleware.js';
import db from '../db.js';

const router = Router();
router.use(authMiddleware);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// GET /api/v1/ai/atlas/market-insight
router.get('/market-insight', async (req: Request, res: Response) => {
  const { view } = req.query;
  // @ts-ignore - authMiddleware adds user to request
  const { userId, tenantId } = req.user;

  try {
    const vendor = await db.vendor.findFirst({
      where: { userId, tenantId },
      include: { _count: { select: { products: true } } }
    });

    const ordersThisWeek = await db.orderItem.count({
      where: {
        product: { vendor: { userId, tenantId } },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    });

    const systemPrompt = `You are ATLAS, the Winners Market AI supervisor.
Context: Vendor has ${vendor?._count.products ?? 0} products. ${ordersThisWeek} orders last 7 days.
Current view: ${view}.
Give ONE concise actionable market insight in max 18 words. Lead with the data.
No preamble. No "Here is your insight". Direct and commercial.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 80,
      messages: [{ role: 'user', content: `Market view: ${view}` }],
      system: systemPrompt,
    });

    const insight = response.content[0].type === 'text' ? response.content[0].text : null;
    res.json({ insight });
  } catch (error) {
    console.error('[atlas] Market insight error:', error);
    res.status(500).json({ error: 'Market insight failed' });
  }
});

// POST /api/v1/ai/atlas/product-score
router.post('/product-score', async (req: Request, res: Response) => {
  const { productId } = req.body;
  // @ts-ignore - authMiddleware adds user to request
  const { userId, tenantId } = req.user;

  try {
    const product = await db.product.findUnique({
      where: { id: productId },
      include: { supplierProduct: { include: { supplier: true } } }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check tenant access
    if (product.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const prompt = `Score this product 0–100 for sales potential in African + diaspora markets.
Product: ${product.name}
Category: ${product.category}
Price: $${product.price}
Cost: $${product.costPrice ?? 'N/A'}
Supplier: ${product.supplierProduct?.supplier?.name ?? 'Own inventory'}
Respond ONLY with valid JSON, no markdown:
{ "score": number, "reasons": string[], "recommendations": string[], "atlasVerdict": string }`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
      system: 'You are ATLAS. Return only valid JSON. No markdown fences.'
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    res.json(parsed);
  } catch (error) {
    console.error('[atlas] Product score error:', error);
    res.status(500).json({ error: 'Product scoring failed' });
  }
});

export default router;
