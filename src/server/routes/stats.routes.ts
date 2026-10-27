import { Router } from 'express';
import { prisma } from '../db.ts';

const router = Router();

// GET /api/stats/public
router.get('/public', async (_req, res) => {
  try {
    const [
      totalStudents,
      activeEvents,
      confirmedRegistrations,
      issuedCertificates,
      colleges,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.event.count({ where: { status: 'PUBLISHED' } }),
      prisma.registration.count({ where: { status: 'CONFIRMED' } }),
      prisma.certificate.count(),
      prisma.profile.findMany({
        where: { college: { not: null } },
        select: { college: true },
        distinct: ['college'],
      }),
    ]);

    res.json({
      totalStudents,
      activeEvents,
      confirmedRegistrations,
      issuedCertificates,
      collegesCount: colleges.length,
      colleges: colleges.map((c) => c.college).filter(Boolean),
    });
  } catch (error: any) {
    console.error('Fetch public stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve stats.' });
  }
});

export default router;
