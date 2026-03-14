// Phase 4 - Winners Market - ATLAS AI Market Intelligence
// Product research, pricing strategy, ad copy generation

import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { authMiddleware } from '../middleware/authMiddleware.js';
import db from '../db.js';

const router = Router();
router.use(authMiddleware);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ATLAS_SYSTEM = `You are ATLAS, Market Intelligence Supervisor for Winners Ecosystem.
You have deep expertise in African and diaspora market dynamics.
You are analytical, commercial, and data-driven.
Always provide actionable, specific intelligence — never generic advice.
African market context: Kenya, Nigeria, Ghana, South Africa, diaspora in UK/US/Canada.`;

router.post('/research', async (req: Request, res: Response) => {
  const { niche, context } = req.body;
  if (!niche) return res.status(400).json({ error: 'niche is required' });
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: ATLAS_SYSTEM + '\nReturn structured JSON with: winningProducts (array of 5 with name, estimatedMargin, supplierRecommendation, targetAudience, africanMarketFit), bestSupplier, pricingStrategy (object with optimal, premium, anchor, breakeven prices), demandForecast (string), atlasConclusion (string).',
      messages: [{ role: 'user', content: `Research niche: ${niche}\n\nContext: ${JSON.stringify(context || {})}` }],
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ token: chunk.delta.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('[atlas] Research error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Research failed' });
  }
});

router.post('/ad-copy', async (req: Request, res: Response) => {
  const { productName, targetAudience, platform, tone } = req.body;
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: ATLAS_SYSTEM,
      messages: [{
        role: 'user',
        content: `Write compelling ${platform || 'social media'} ad copy for: ${productName}
Target audience: ${targetAudience || 'African consumers aged 18-45'}
Tone: ${tone || 'energetic and aspirational'}
Include: headline, body copy, CTA. Make it culturally resonant for African/diaspora markets.`,
      }],
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ token: chunk.delta.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('[atlas] Ad copy error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Ad copy generation failed' });
  }
});

router.post('/pricing', async (req: Request, res: Response) => {
  const { productName, cost, competitors, market } = req.body;
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: ATLAS_SYSTEM,
      messages: [{
        role: 'user',
        content: `Analyze pricing for: ${productName}
Cost price: $${cost}
Competitors: ${JSON.stringify(competitors || [])}
Target market: ${market || 'African e-commerce'}
Return JSON: { optimal: number, premium: number, anchor: number, breakeven: number, recommendedStrategy: string, reasoning: string }`,
      }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const pricing = JSON.parse(text);
    return res.json(pricing);
  } catch (error) {
    console.error('[atlas] Pricing error:', error);
    return res.status(500).json({ error: 'Pricing analysis failed' });
  }
});

router.post('/strategy', async (req: Request, res: Response) => {
  const { businessType, currentRevenue, goals, timeframe } = req.body;
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: ATLAS_SYSTEM,
      messages: [{
        role: 'user',
        content: `Create a ${timeframe || '90-day'} growth strategy for:
Business type: ${businessType}
Current revenue: $${currentRevenue || 0}/month
Goals: ${goals}
Include: 3 monthly phases with specific actions, KPIs, and African market opportunities.`,
      }],
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ token: chunk.delta.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('[atlas] Strategy error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Strategy generation failed' });
  }
});

router.post('/product-photo-analysis', async (req: Request, res: Response) => {
  const { imageUrl, productName } = req.body;
  if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required' });
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: ATLAS_SYSTEM,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'url', url: imageUrl },
          },
          {
            type: 'text',
            text: `Analyze this product photo for ${productName || 'this product'} for e-commerce listing optimization.
Return JSON: { backgroundScore: number 1-10, lightingScore: number 1-10, overallScore: number 1-10, issues: string[], improvements: string[], verdict: string }`,
          },
        ],
      }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    return res.json(JSON.parse(text));
  } catch (error) {
    console.error('[atlas] Photo analysis error:', error);
    return res.status(500).json({ error: 'Photo analysis failed' });
  }
});

router.post('/chat', async (req: Request, res: Response) => {
  const { message, history } = req.body;
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const messages = [
      ...(history || []).slice(-10).map((m: any) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: message },
    ];

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: ATLAS_SYSTEM,
      messages,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ token: chunk.delta.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('[atlas] Chat error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Chat failed' });
  }
});

export default router;