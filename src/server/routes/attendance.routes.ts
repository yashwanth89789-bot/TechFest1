import { Router, Response } from 'express';
import { prisma } from '../db.ts';
import {
  authenticate,
  requireRole,
  AuthenticatedRequest,
  createAuditLog,
  sendNotification,
} from '../auth.ts';

const router = Router();

// POST /api/events/:id/check-in (Scan QR code or manual fallback)
router.post(
  '/:id/check-in',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: eventId } = req.params;
      const { ticketToken, registrationNumber, method = 'QR_SCAN' } = req.body;

      if (!ticketToken && !registrationNumber) {
        return res.status(400).json({ error: 'Please provide either a ticket token or registration number.' });
      }

      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) return res.status(404).json({ error: 'Event not found.' });

      if (req.user!.role !== 'ADMIN' && event.organizerId !== req.user!.id) {
        return res.status(403).json({ error: 'You are not authorized to check in participants for this event.' });
      }

      // Find registration by ticketToken OR registrationNumber
      let registration = null;

      if (ticketToken) {
        const ticket = await prisma.ticket.findUnique({
          where: { ticketToken: ticketToken.trim() },
          include: {
            registration: {
              include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true, profile: true } },
                attendance: true,
                team: true,
              },
            },
          },
        });
        if (ticket) {
          registration = ticket.registration;
        }
      }

      if (!registration && registrationNumber) {
        registration = await prisma.registration.findUnique({
          where: { registrationNumber: registrationNumber.trim().toUpperCase() },
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true, profile: true } },
            attendance: true,
            team: true,
          },
        });
      }

      if (!registration) {
        return res.status(404).json({
          status: 'INVALID',
          error: 'No valid ticket or registration found matching the provided code.',
        });
      }

      // Verify registration belongs to THIS event
      if (registration.eventId !== eventId) {
        return res.status(400).json({
          status: 'WRONG_EVENT',
          error: `This ticket belongs to a different event, not "${event.title}".`,
          participant: {
            name: registration.user.name,
            registrationNumber: registration.registrationNumber,
          },
        });
      }

      // Verify status is CONFIRMED
      if (registration.status !== 'CONFIRMED') {
        return res.status(400).json({
          status: 'NOT_CONFIRMED',
          error: `Registration is not confirmed (Current Status: ${registration.status}).`,
          participant: {
            name: registration.user.name,
            registrationNumber: registration.registrationNumber,
            status: registration.status,
          },
        });
      }

      // Check if ALREADY checked in
      if (registration.attendance) {
        return res.status(409).json({
          status: 'ALREADY_CHECKED_IN',
          error: `Participant ${registration.user.name} was already checked in at ${new Date(
            registration.attendance.checkedInAt
          ).toLocaleTimeString()}.`,
          attendance: registration.attendance,
          participant: {
            name: registration.user.name,
            email: registration.user.email,
            registrationNumber: registration.registrationNumber,
            college: registration.user.profile?.college,
            teamName: registration.team?.name,
          },
        });
      }

      // Record attendance
      const attendance = await prisma.attendance.create({
        data: {
          eventId,
          registrationId: registration.id,
          checkedInById: req.user!.id,
          checkInMethod: method,
          checkedInAt: new Date(),
        },
      });

      // Send notification to attendee
      await sendNotification({
        userId: registration.userId,
        title: `Attendance Checked In! ✅ ${event.title}`,
        message: `Welcome to ${event.title}! Your check-in was verified at ${new Date().toLocaleTimeString()}.`,
        type: 'ATTENDANCE',
        link: '/tickets',
      });

      await createAuditLog({
        actorId: req.user!.id,
        action: 'ATTENDANCE_RECORDED',
        targetType: 'ATTENDANCE',
        targetId: attendance.id,
        details: {
          registrationNumber: registration.registrationNumber,
          eventId,
          method,
        },
      });

      res.status(200).json({
        status: 'SUCCESS',
        message: `Check-in verified successfully for ${registration.user.name}!`,
        attendance,
        participant: {
          id: registration.user.id,
          name: registration.user.name,
          email: registration.user.email,
          avatarUrl: registration.user.avatarUrl,
          registrationNumber: registration.registrationNumber,
          college: registration.user.profile?.college,
          department: registration.user.profile?.department,
          studentId: registration.user.profile?.studentIdNumber,
          teamName: registration.team?.name,
        },
      });
    } catch (error: any) {
      console.error('Check-in error:', error);
      res.status(500).json({ error: 'Server error verifying check-in.' });
    }
  }
);

// GET /api/events/:id/attendance (Attendance reports and stats)
router.get(
  '/:id/attendance',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: eventId } = req.params;

      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) return res.status(404).json({ error: 'Event not found.' });

      if (req.user!.role !== 'ADMIN' && event.organizerId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized.' });
      }

      const [attendances, totalConfirmed] = await Promise.all([
        prisma.attendance.findMany({
          where: { eventId },
          include: {
            registration: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                    profile: true,
                  },
                },
                team: true,
              },
            },
          },
          orderBy: { checkedInAt: 'desc' },
        }),
        prisma.registration.count({
          where: { eventId, status: 'CONFIRMED' },
        }),
      ]);

      const attendanceCount = attendances.length;
      const attendanceRate = totalConfirmed > 0 ? Math.round((attendanceCount / totalConfirmed) * 100) : 0;

      res.json({
        stats: {
          totalConfirmed,
          totalAttended: attendanceCount,
          attendanceRate,
          remaining: Math.max(0, totalConfirmed - attendanceCount),
        },
        attendances,
      });
    } catch (error: any) {
      console.error('Fetch attendance error:', error);
      res.status(500).json({ error: 'Failed to retrieve attendance report.' });
    }
  }
);

export default router;
