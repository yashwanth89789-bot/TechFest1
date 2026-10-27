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

function generateRegNumber(eventSlug: string): string {
  const prefix = eventSlug.slice(0, 4).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `REG-2026-${prefix}-${random}`;
}

function generateTicketToken(): string {
  return `TKT-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

// POST /api/events/:id/register
router.post('/:id/register', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: eventId } = req.params;
    const { teamId, notes } = req.body;
    const userId = req.user!.id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { category: true },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    if (event.status !== 'PUBLISHED') {
      return res.status(400).json({ error: 'Registrations are currently closed for this event.' });
    }

    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ error: 'The registration deadline for this event has passed.' });
    }

    const existingReg = await prisma.registration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (existingReg && existingReg.status !== 'CANCELLED') {
      return res.status(400).json({
        error: `You are already registered for this event (Status: ${existingReg.status}).`,
        registration: existingReg,
      });
    }

    let verifiedTeamId: string | null = null;
    if (event.registrationType === 'TEAM') {
      if (!teamId) {
        return res.status(400).json({
          error: 'This event requires a team registration. Please create or join a team first.',
        });
      }

      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: { members: true },
      });

      if (!team || team.eventId !== eventId) {
        return res.status(400).json({ error: 'Invalid team selected for this event.' });
      }

      const isMember = team.members.some((m) => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ error: 'You are not a registered member of this team.' });
      }

      verifiedTeamId = team.id;
    }

    const registrationResult = await prisma.$transaction(async (tx) => {
      const confirmedCount = await tx.registration.count({
        where: {
          eventId,
          status: 'CONFIRMED',
        },
      });

      const isWaitlisted = confirmedCount >= event.capacity;
      let waitlistPos: number | null = null;

      if (isWaitlisted) {
        const lastWaitlisted = await tx.registration.findFirst({
          where: { eventId, status: 'WAITLISTED' },
          orderBy: { waitlistPosition: 'desc' },
          select: { waitlistPosition: true },
        });
        waitlistPos = (lastWaitlisted?.waitlistPosition || 0) + 1;
      }

      const regNumber = generateRegNumber(event.slug);
      const regStatus = isWaitlisted ? 'WAITLISTED' : 'CONFIRMED';

      let registration;
      if (existingReg && existingReg.status === 'CANCELLED') {
        registration = await tx.registration.update({
          where: { id: existingReg.id },
          data: {
            registrationNumber: regNumber,
            teamId: verifiedTeamId,
            status: regStatus,
            waitlistPosition: waitlistPos,
            notes,
          },
        });
      } else {
        registration = await tx.registration.create({
          data: {
            registrationNumber: regNumber,
            eventId,
            userId,
            teamId: verifiedTeamId,
            status: regStatus,
            waitlistPosition: waitlistPos,
            notes,
          },
        });
      }

      let ticket = null;
      if (regStatus === 'CONFIRMED') {
        const ticketToken = generateTicketToken();
        const qrCodePayload = JSON.stringify({
          app: 'TechFestHub',
          regId: registration.registrationNumber,
          eventId: event.id,
          eventName: event.title,
          attendee: req.user!.name,
          email: req.user!.email,
          token: ticketToken,
        });

        ticket = await tx.ticket.create({
          data: {
            registrationId: registration.id,
            ticketToken,
            qrCodeData: qrCodePayload,
          },
        });
      }

      return { registration, ticket, isWaitlisted, waitlistPos };
    });

    if (registrationResult.isWaitlisted) {
      await sendNotification({
        userId,
        title: `Added to Waitlist: ${event.title}`,
        message: `The event has reached full capacity. You are placed at position #${registrationResult.waitlistPos} on the waitlist. You will be automatically promoted if a spot opens up.`,
        type: 'WAITLIST',
        link: '/registrations',
      });
    } else {
      await sendNotification({
        userId,
        title: `Registration Confirmed! 🎉 ${event.title}`,
        message: `Your registration #${registrationResult.registration.registrationNumber} is confirmed! Your digital QR ticket is ready.`,
        type: 'REGISTRATION',
        link: '/tickets',
      });
    }

    await createAuditLog({
      actorId: userId,
      action: registrationResult.isWaitlisted ? 'REGISTERED_WAITLIST' : 'REGISTERED_CONFIRMED',
      targetType: 'EVENT',
      targetId: eventId,
      details: {
        registrationNumber: registrationResult.registration.registrationNumber,
        status: registrationResult.registration.status,
      },
    });

    res.status(201).json({
      message: registrationResult.isWaitlisted
        ? `Event is currently at maximum capacity. You have been placed at position #${registrationResult.waitlistPos} on the waitlist.`
        : 'Registration confirmed successfully! Your digital ticket is ready.',
      registration: registrationResult.registration,
      ticket: registrationResult.ticket,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to complete registration. Please try again.' });
  }
});

// GET /api/registrations/me
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const registrations = await prisma.registration.findMany({
      where: { userId: req.user!.id },
      include: {
        event: {
          include: {
            category: true,
            organizer: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        ticket: true,
        attendance: true,
        team: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(registrations);
  } catch (error: any) {
    console.error('Fetch my registrations error:', error);
    res.status(500).json({ error: 'Failed to retrieve registrations.' });
  }
});

// GET /api/events/:id/registrations (Organizer or Admin view)
router.get('/:id/registrations', authenticate, requireRole('ORGANIZER', 'ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: eventId } = req.params;
    const { status, export: exportFormat } = req.query;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) return res.status(404).json({ error: 'Event not found.' });

    if (req.user!.role !== 'ADMIN' && event.organizerId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to view participants for this event.' });
    }

    const where: any = { eventId };
    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }

    const registrations = await prisma.registration.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true,
          },
        },
        team: true,
        ticket: true,
        attendance: true,
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
    });

    if (exportFormat === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${event.slug}-participants.csv"`);

      let csv = 'Registration ID,Name,Email,College,Department,Phone,Status,Waitlist Position,Team,Checked In,Check-in Time\n';
      for (const r of registrations) {
        const checkedIn = r.attendance ? 'YES' : 'NO';
        const checkedInTime = r.attendance ? r.attendance.checkedInAt.toISOString() : '';
        const teamName = r.team ? `"${r.team.name.replace(/"/g, '""')}"` : '';
        const college = r.user.profile?.college ? `"${r.user.profile.college.replace(/"/g, '""')}"` : '';
        const dept = r.user.profile?.department ? `"${r.user.profile.department.replace(/"/g, '""')}"` : '';
        const phone = r.user.profile?.phoneNumber || '';

        csv += `"${r.registrationNumber}","${r.user.name}","${r.user.email}",${college},${dept},"${phone}","${r.status}","${r.waitlistPosition || ''}",${teamName},"${checkedIn}","${checkedInTime}"\n`;
      }
      return res.send(csv);
    }

    res.json({
      event: { id: event.id, title: event.title, capacity: event.capacity },
      registrations,
    });
  } catch (error: any) {
    console.error('Fetch event registrations error:', error);
    res.status(500).json({ error: 'Failed to retrieve event participants.' });
  }
});

// PATCH /api/registrations/item/:id/status
router.patch('/item/:id/status', authenticate, requireRole('ORGANIZER', 'ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        event: true,
        user: true,
        ticket: true,
      },
    });

    if (!registration) return res.status(404).json({ error: 'Registration not found.' });

    if (req.user!.role !== 'ADMIN' && registration.event.organizerId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      let ticket = registration.ticket;
      if (status === 'CONFIRMED' && !ticket) {
        const ticketToken = generateTicketToken();
        ticket = await tx.ticket.create({
          data: {
            registrationId: registration.id,
            ticketToken,
            qrCodeData: JSON.stringify({
              app: 'TechFestHub',
              regId: registration.registrationNumber,
              eventId: registration.eventId,
              eventName: registration.event.title,
              attendee: registration.user.name,
              token: ticketToken,
            }),
          },
        });
      }

      return tx.registration.update({
        where: { id },
        data: {
          status,
          notes: notes || registration.notes,
          waitlistPosition: status === 'CONFIRMED' ? null : registration.waitlistPosition,
        },
        include: { ticket: true, user: true },
      });
    });

    await sendNotification({
      userId: registration.userId,
      title: `Registration Status Update: ${registration.event.title}`,
      message: `Your registration status for "${registration.event.title}" has been updated to ${status}.`,
      type: 'REGISTRATION',
      link: status === 'CONFIRMED' ? '/tickets' : '/registrations',
    });

    await createAuditLog({
      actorId: req.user!.id,
      action: 'REGISTRATION_STATUS_MODIFIED',
      targetType: 'REGISTRATION',
      targetId: id,
      details: { newStatus: status, previousStatus: registration.status },
    });

    res.json({ message: `Registration status updated to ${status}.`, registration: updated });
  } catch (error: any) {
    console.error('Update registration status error:', error);
    res.status(500).json({ error: 'Failed to update registration status.' });
  }
});

// POST /api/registrations/item/:id/cancel
router.post('/item/:id/cancel', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        event: true,
        user: true,
      },
    });

    if (!registration) return res.status(404).json({ error: 'Registration not found.' });

    const isOwner = registration.userId === userId;
    const isAuthorized = isOwner || req.user!.role === 'ADMIN' || registration.event.organizerId === userId;

    if (!isAuthorized) {
      return res.status(403).json({ error: 'You are not authorized to cancel this registration.' });
    }

    const wasConfirmed = registration.status === 'CONFIRMED';

    const result = await prisma.$transaction(async (tx) => {
      const cancelledReg = await tx.registration.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          waitlistPosition: null,
        },
      });

      let promotedReg = null;

      if (wasConfirmed) {
        const nextInLine = await tx.registration.findFirst({
          where: {
            eventId: registration.eventId,
            status: 'WAITLISTED',
          },
          orderBy: { waitlistPosition: 'asc' },
          include: { user: true },
        });

        if (nextInLine) {
          const ticketToken = generateTicketToken();
          promotedReg = await tx.registration.update({
            where: { id: nextInLine.id },
            data: {
              status: 'CONFIRMED',
              waitlistPosition: null,
            },
            include: { user: true },
          });

          await tx.ticket.create({
            data: {
              registrationId: nextInLine.id,
              ticketToken,
              qrCodeData: JSON.stringify({
                app: 'TechFestHub',
                regId: nextInLine.registrationNumber,
                eventId: registration.eventId,
                eventName: registration.event.title,
                attendee: nextInLine.user.name,
                token: ticketToken,
              }),
            },
          });

          await tx.registration.updateMany({
            where: {
              eventId: registration.eventId,
              status: 'WAITLISTED',
              waitlistPosition: { gt: nextInLine.waitlistPosition || 0 },
            },
            data: {
              waitlistPosition: { decrement: 1 },
            },
          });
        }
      }

      return { cancelledReg, promotedReg };
    });

    await sendNotification({
      userId: registration.userId,
      title: `Registration Cancelled: ${registration.event.title}`,
      message: `Your registration for "${registration.event.title}" has been cancelled.`,
      type: 'REGISTRATION',
      link: '/events',
    });

    if (result.promotedReg) {
      await sendNotification({
        userId: result.promotedReg.userId,
        title: `You've Been Promoted! 🎉 ${registration.event.title}`,
        message: `A spot opened up for "${registration.event.title}"! Your waitlist status has been automatically promoted to CONFIRMED. Your digital ticket is now active.`,
        type: 'WAITLIST',
        link: '/tickets',
      });
    }

    await createAuditLog({
      actorId: userId,
      action: 'REGISTRATION_CANCELLED',
      targetType: 'REGISTRATION',
      targetId: id,
      details: {
        wasConfirmed,
        promotedUserId: result.promotedReg?.userId || null,
      },
    });

    res.json({
      message: 'Registration has been cancelled successfully.',
      registration: result.cancelledReg,
      promotedParticipant: result.promotedReg
        ? { id: result.promotedReg.id, userName: result.promotedReg.user.name }
        : null,
    });
  } catch (error: any) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ error: 'Failed to cancel registration.' });
  }
});

export default router;
