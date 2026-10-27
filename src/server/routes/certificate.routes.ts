import { Router, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../db.ts';
import {
  authenticate,
  requireRole,
  AuthenticatedRequest,
  createAuditLog,
  sendNotification,
} from '../auth.ts';

const router = Router();

function generateCertNumber(): string {
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `CERT-TECHFEST-2026-${rand}`;
}

// GET /api/certificates/me (Student views earned certificates)
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { userId: req.user!.id },
      include: {
        event: {
          include: {
            category: true,
            organizer: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    res.json(certificates);
  } catch (error: any) {
    console.error('Fetch my certificates error:', error);
    res.status(500).json({ error: 'Failed to retrieve certificates.' });
  }
});

// GET /api/certificates/verify/:number (Public verification)
router.get('/verify/:number', async (req, res) => {
  try {
    const { number } = req.params;

    const cert = await prisma.certificate.findUnique({
      where: { certificateNumber: number.trim().toUpperCase() },
      include: {
        event: {
          include: {
            category: true,
            organizer: { select: { id: true, name: true, email: true } },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            profile: {
              select: { college: true, department: true, studentIdNumber: true },
            },
          },
        },
      },
    });

    if (!cert) {
      return res.status(404).json({
        isValid: false,
        error: 'Certificate not found. The certificate number is invalid or has been revoked.',
      });
    }

    res.json({
      isValid: true,
      certificate: {
        certificateNumber: cert.certificateNumber,
        title: cert.title,
        recipientName: cert.recipientName,
        issuedAt: cert.issuedAt,
        event: {
          title: cert.event.title,
          category: cert.event.category.name,
          startDate: cert.event.startDate,
          endDate: cert.event.endDate,
          organizer: cert.event.organizer.name,
        },
        recipient: {
          name: cert.user.name,
          college: cert.user.profile?.college,
          department: cert.user.profile?.department,
        },
      },
    });
  } catch (error: any) {
    console.error('Verify certificate error:', error);
    res.status(500).json({ error: 'Failed to verify certificate.' });
  }
});

// POST /api/events/:id/certificates (Organizer/Admin issue certificates)
router.post(
  '/:id/certificates',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: eventId } = req.params;
      const { userIds, customTitle } = req.body; // optional userIds array; if empty, issues to all checked-in

      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) return res.status(404).json({ error: 'Event not found.' });

      if (req.user!.role !== 'ADMIN' && event.organizerId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized to issue certificates for this event.' });
      }

      // Query verified attendances for this event
      const attendanceWhere: any = { eventId };
      if (userIds && Array.isArray(userIds) && userIds.length > 0) {
        attendanceWhere.registration = {
          userId: { in: userIds },
        };
      }

      const attendances = await prisma.attendance.findMany({
        where: attendanceWhere,
        include: {
          registration: {
            include: { user: true },
          },
        },
      });

      if (attendances.length === 0) {
        return res.status(400).json({
          error:
            'No verified attendees found. Certificates can only be issued to participants who have attended and checked into the event.',
        });
      }

      const title = customTitle || `Certificate of Technical Achievement — ${event.title}`;
      const issued: any[] = [];

      for (const att of attendances) {
        const student = att.registration.user;

        // Check if certificate already issued for this student & event
        const existingCert = await prisma.certificate.findFirst({
          where: {
            eventId,
            userId: student.id,
          },
        });

        if (!existingCert) {
          const certNum = generateCertNumber();
          const newCert = await prisma.certificate.create({
            data: {
              certificateNumber: certNum,
              eventId,
              userId: student.id,
              title,
              recipientName: student.name,
              verificationUrl: `/verify-certificate?id=${certNum}`,
            },
          });

          await sendNotification({
            userId: student.id,
            title: `Verified Certificate Issued! 🎓`,
            message: `Congratulations! Your certificate for "${event.title}" has been issued. View and download it now.`,
            type: 'CERTIFICATE',
            link: '/certificates',
          });

          issued.push(newCert);
        }
      }

      await createAuditLog({
        actorId: req.user!.id,
        action: 'CERTIFICATES_ISSUED',
        targetType: 'EVENT',
        targetId: eventId,
        details: { count: issued.length, eventTitle: event.title },
      });

      res.status(201).json({
        message: `Successfully issued ${issued.length} verified certificate(s).`,
        issuedCount: issued.length,
        certificates: issued,
      });
    } catch (error: any) {
      console.error('Issue certificates error:', error);
      res.status(500).json({ error: 'Failed to issue certificates.' });
    }
  }
);

export default router;
