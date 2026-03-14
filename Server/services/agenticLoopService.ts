// Phase 6 - Agentic Loop Service
// Certificate earned -> CIRCUIT matching -> Work notification

import db from '../db.js';
import { sendPushNotification } from './fcmService.js';

export interface AgenticTrigger {
  userId: string;
  tenantId: string;
  triggerType: string;
  layer: string;
  data?: Record<string, unknown>;
}

export async function triggerAgenticLoop(trigger: AgenticTrigger): Promise<void> {
  try {
    await db.agenticLoopProgress.upsert({
      where: { userId_tenantId: { userId: trigger.userId, tenantId: trigger.tenantId } },
      create: {
        userId: trigger.userId,
        tenantId: trigger.tenantId,
        stage: trigger.triggerType,
        stagesCompleted: [trigger.triggerType],
        lastActivity: new Date(),
        loopCount: 1,
      },
      update: {
        stage: trigger.triggerType,
        lastActivity: new Date(),
      },
    });

    if (trigger.triggerType === 'certificate_earned') {
      const courseId = trigger.data?.courseId as string | undefined;
      if (courseId) {
        await onCertificateEarned(trigger.userId, courseId, trigger.tenantId);
      }
    }
    if (trigger.triggerType === 'contract_completed') {
      const contractId = trigger.data?.contractId as string | undefined;
      if (contractId) {
        await onContractCompleted(contractId, trigger.userId, trigger.tenantId);
      }
    }
  } catch (error) {
    console.error('[agenticLoop] triggerAgenticLoop error:', error);
  }
}

export async function onCertificateEarned(userId: string, courseId: string, tenantId: string): Promise<void> {
  try {
    const cert = await db.certificate.findFirst({ where: { userId, courseId, tenantId } });
    if (!cert) return;

    const certSkills = (cert as any).skills as string[] | undefined;
    const skill = certSkills?.[0] || cert.title;

    const jobs = await db.jobListing.findMany({
      where: {
        tenantId,
        status: 'OPEN',
        OR: [
          { skills: { has: skill } },
          { title: { contains: skill, mode: 'insensitive' } },
        ],
      },
      orderBy: { budget: 'desc' },
      take: 5,
    });

    if (!jobs.length) return;

    const bestJob = jobs[0];

    await db.notification.create({
      data: {
        tenantId,
        userId,
        type: 'circuit_job_match',
        title: 'CIRCUIT: New Job Match',
        message: `Your new "${cert.title}" certificate matches a $${bestJob.budget} job opportunity. CIRCUIT has a draft proposal ready.`,
        data: { jobId: bestJob.id, certId: cert.id, matchCount: jobs.length },
      },
    });

    await sendPushNotification(userId, {
      title: 'CIRCUIT: Job Match Found',
      body: `Your ${cert.title} cert matches a $${bestJob.budget} contract. Tap to view.`,
      url: `/work/jobs/${bestJob.id}`,
      data: { type: 'job_match', jobId: bestJob.id },
    });
  } catch (error) {
    console.error('[agenticLoop] onCertificateEarned error:', error);
  }
}

export async function onContractCompleted(contractId: string, freelancerId: string, tenantId: string): Promise<void> {
  try {
    const contract = await db.contract.findFirst({
      where: { id: contractId, tenantId },
      include: { freelancer: { include: { user: true } } },
    });
    if (!contract) return;

    await db.freelancerProfile.update({
      where: { id: contract.freelancerId },
      data: {
        totalEarnings: { increment: contract.amount },
        totalJobs: { increment: 1 },
      },
    });

    await sendPushNotification(freelancerId, {
      title: 'Contract Completed',
      body: `Your contract "${contract.title}" is complete. Funds will be released shortly.`,
      url: `/work/contracts/${contractId}`,
      data: { type: 'contract_completed', contractId },
    });
  } catch (error) {
    console.error('[agenticLoop] onContractCompleted error:', error);
  }
}
