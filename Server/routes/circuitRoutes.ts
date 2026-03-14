// Phase 6 - Winners Work - CIRCUIT AI Matching + Proposal Generator
// Job-freelancer matching using Academy certs + NOVA skill signals

import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { authMiddleware } from '../middleware/authMiddleware.js';
import db from '../db.js';

const router = Router();
router.use(authMiddleware);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.get('/match/:jobId', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  const { jobId } = req.params;
  try {
    const [job, freelancer, certs, skills] = await Promise.all([
      db.jobListing.findFirst({ where: { id: jobId, tenantId } }),
      db.freelancerProfile.findFirst({ where: { userId, tenantId } }),
      db.certificate.findMany({ where: { userId, tenantId }, take: 10 }),
      db.novaSkillDetection.findMany({ where: { userId, tenantId, confidence: { gte: 0.7 } }, take: 20 }),
    ]);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (!freelancer) return res.status(404).json({ error: 'Freelancer profile not found' });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: `You are CIRCUIT, Work Intelligence Supervisor for Winners Ecosystem. Score this job-freelancer match and return ONLY valid JSON with this structure:
{
  "total": number 0-100,
  "breakdown": {
    "skillsOverlap": number,
    "experienceMatch": number,
    "budgetFit": number,
    "clientQuality": number
  },
  "verdict": "perfect" | "strong" | "good" | "stretch" | "mismatch",
  "topGap": "string describing biggest gap",
  "applyRecommendation": boolean,
  "estimatedWinProbability": number 0-100
}`,
      messages: [{
        role: 'user',
        content: `Job: ${JSON.stringify({ title: job.title, description: job.description, skills: job.skills, budget: job.budget, experienceLevel: job.experienceLevel })}
Freelancer: ${JSON.stringify({ skills: freelancer.skills, hourlyRate: freelancer.hourlyRate, bio: freelancer.bio })}
Certificates: ${JSON.stringify(certs.map(c => ({ title: c.title, skills: c.skills })))}
Detected skills: ${JSON.stringify(skills.map(s => ({ skill: s.skill, confidence: s.confidence })))}`,
      }],
    });

    const score = JSON.parse(response.content[0].type === 'text' ? response.content[0].text : '{}');
    return res.json({ jobId, score, jobTitle: job.title });
  } catch (error) {
    console.error('[circuit] Match error:', error);
    return res.status(500).json({ error: 'Failed to score match' });
  }
});

router.post('/propose', async (req: Request, res: Response) => {
  const { jobId } = req.body;
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  try {
    const [job, freelancer, certs] = await Promise.all([
      db.jobListing.findFirst({ where: { id: jobId, tenantId } }),
      db.freelancerProfile.findFirst({ where: { userId, tenantId } }),
      db.certificate.findMany({ where: { userId, tenantId }, take: 3 }),
    ]);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (!freelancer) return res.status(404).json({ error: 'Freelancer profile not found — create one first' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: `You are CIRCUIT, Work Supervisor for Winners Ecosystem. Write a winning job proposal.
Rules:
1. Open with the client's specific challenge — never a greeting
2. Reference the freelancer's most relevant certificate by exact name if available
3. Propose a clear 3-milestone delivery plan
4. Close with one domain-specific question showing expertise
5. Maximum 250 words. Never use filler phrases like "I am writing to express interest"`,
      messages: [{
        role: 'user',
        content: `Job: ${job.title} — ${job.description?.slice(0, 300)}
Budget: $${job.budget}
Freelancer bio: ${freelancer.bio?.slice(0, 200)}
Top certificates: ${certs.map(c => c.title).join(', ') || 'none'}`,
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
    console.error('[circuit] Propose error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate proposal' });
  }
});

router.get('/top-jobs', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  try {
    const [freelancer, certs, skills] = await Promise.all([
      db.freelancerProfile.findFirst({ where: { userId, tenantId } }),
      db.certificate.findMany({ where: { userId, tenantId }, take: 5 }),
      db.novaSkillDetection.findMany({ where: { userId, tenantId }, orderBy: { confidence: 'desc' }, take: 10 }),
    ]);
    if (!freelancer) return res.json({ jobs: [], message: 'Create a freelancer profile to get matched jobs' });

    const freelancerSkills = [
      ...(freelancer.skills || []),
      ...certs.map(c => c.skills || []).flat(),
      ...skills.map(s => s.skill),
    ];
    const uniqueSkills = [...new Set(freelancerSkills)].slice(0, 15);

    const jobs = await db.jobListing.findMany({
      where: {
        tenantId,
        status: 'OPEN',
        OR: uniqueSkills.length > 0 ? [{ skills: { hasSome: uniqueSkills } }] : undefined,
      },
      orderBy: { budget: 'desc' },
      take: 10,
      include: { client: { select: { id: true, name: true } }, _count: { select: { applications: true } } },
    });

    return res.json({ jobs, matchedSkills: uniqueSkills.slice(0, 5) });
  } catch (error) {
    console.error('[circuit] Top jobs error:', error);
    return res.status(500).json({ error: 'Failed to get top jobs' });
  }
});

router.post('/skill-gap', async (req: Request, res: Response) => {
  const { jobId } = req.body;
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  try {
    const [job, certs, skills] = await Promise.all([
      db.jobListing.findFirst({ where: { id: jobId, tenantId } }),
      db.certificate.findMany({ where: { userId, tenantId } }),
      db.novaSkillDetection.findMany({ where: { userId, tenantId } }),
    ]);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const userSkills = [...new Set([
      ...certs.map(c => c.skills || []).flat(),
      ...skills.map(s => s.skill),
    ])];
    const jobSkills = job.skills || [];
    const gaps = jobSkills.filter(s => !userSkills.some(u => u.toLowerCase().includes(s.toLowerCase())));

    const courses = gaps.length > 0
      ? await db.course.findMany({
          where: { tenantId, isPublished: true, OR: gaps.map(g => ({ title: { contains: g, mode: 'insensitive' as const } })) },
          take: 3,
          select: { id: true, title: true, slug: true },
        })
      : [];

    return res.json({ gaps, suggestedCourses: courses, userSkills: userSkills.slice(0, 10) });
  } catch (error) {
    console.error('[circuit] Skill gap error:', error);
    return res.status(500).json({ error: 'Failed to analyze skill gap' });
  }
});

export default router;