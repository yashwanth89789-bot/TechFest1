import { Router, Response } from 'express';
import { prisma } from '../db.ts';
import {
  authenticate,
  optionalAuthenticate,
  requireRole,
  AuthenticatedRequest,
  createAuditLog,
  sendNotification,
} from '../auth.ts';

const router = Router();

// Helper to generate a slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .concat('-', Math.random().toString(36).substring(2, 6));
}

// GET /api/events
router.get('/', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      search,
      category,
      format,
      status,
      mode,
      sortBy = 'date_asc',
      page = '1',
      limit = '12',
    } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit || '12', 10)));
    const skip = (pageNum - 1) * pageSize;

    const where: any = {};

    // By default, public listing only returns PUBLISHED events unless status is specified
    if (status) {
      where.status = status;
    } else {
      where.status = 'PUBLISHED';
    }

    if (category) {
      where.category = {
        slug: category,
      };
    }

    if (format && ['OFFLINE', 'ONLINE', 'HYBRID'].includes(format)) {
      where.format = format;
    }

    if (mode && ['INDIVIDUAL', 'TEAM'].includes(mode)) {
      where.registrationType = mode;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { shortDescription: { contains: q } },
        { venue: { contains: q } },
      ];
    }

    let orderBy: any = { startDate: 'asc' };
    if (sortBy === 'date_desc') {
      orderBy = { startDate: 'desc' };
    } else if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (sortBy === 'capacity') {
      orderBy = { capacity: 'desc' };
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          category: true,
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              profile: {
                select: { college: true, department: true },
              },
            },
          },
          _count: {
            select: {
              registrations: {
                where: { status: 'CONFIRMED' },
              },
            },
          },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.event.count({ where }),
    ]);

    // Map confirmed count into event object
    const transformed = events.map((ev) => ({
      ...ev,
      confirmedCount: ev._count.registrations,
      availableSpots: Math.max(0, ev.capacity - ev._count.registrations),
      isFull: ev._count.registrations >= ev.capacity,
      isDeadlinePassed: new Date() > new Date(ev.registrationDeadline),
    }));

    res.json({
      events: transformed,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error('Fetch events error:', error);
    res.status(500).json({ error: 'Failed to retrieve events.' });
  }
});

// GET /api/events/categories
router.get('/categories/all', async (_req, res) => {
  try {
    const categories = await prisma.eventCategory.findMany({
      include: {
        _count: {
          select: {
            events: {
              where: { status: 'PUBLISHED' },
            },
          },
        },
      },
    });
    res.json(categories);
  } catch (error: any) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ error: 'Failed to retrieve event categories.' });
  }
});

// GET /api/events/:id
router.get('/:id', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: true,
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            profile: true,
          },
        },
        _count: {
          select: {
            registrations: {
              where: { status: 'CONFIRMED' },
            },
            teams: true,
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const waitlistCount = await prisma.registration.count({
      where: {
        eventId: event.id,
        status: 'WAITLISTED',
      },
    });

    // If authenticated, check current user's registration
    let userRegistration = null;
    let userTeam = null;

    if (req.user) {
      userRegistration = await prisma.registration.findUnique({
        where: {
          eventId_userId: {
            eventId: event.id,
            userId: req.user.id,
          },
        },
        include: {
          ticket: true,
          attendance: true,
          team: {
            include: {
              members: {
                include: {
                  user: {
                    select: { id: true, name: true, email: true },
                  },
                },
              },
            },
          },
        },
      });

      // Find if user is part of any team for this event
      const membership = await prisma.teamMembership.findFirst({
        where: {
          userId: req.user.id,
          team: { eventId: event.id },
        },
        include: {
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
      });

      if (membership) {
        userTeam = membership.team;
      }
    }

    res.json({
      event: {
        ...event,
        confirmedCount: event._count.registrations,
        waitlistCount,
        availableSpots: Math.max(0, event.capacity - event._count.registrations),
        isFull: event._count.registrations >= event.capacity,
        isDeadlinePassed: new Date() > new Date(event.registrationDeadline),
      },
      userRegistration,
      userTeam,
    });
  } catch (error: any) {
    console.error('Fetch single event error:', error);
    res.status(500).json({ error: 'Failed to retrieve event details.' });
  }
});

// POST /api/events (Create Event)
router.post(
  '/',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        title,
        description,
        shortDescription,
        categoryId,
        bannerUrl,
        format = 'OFFLINE',
        venue,
        onlineLink,
        startDate,
        endDate,
        registrationDeadline,
        capacity = 100,
        registrationType = 'INDIVIDUAL',
        minTeamSize = 1,
        maxTeamSize = 4,
        eligibility,
        rules,
        prizes,
        status = 'PUBLISHED',
      } = req.body;

      if (!title || !description || !categoryId || !startDate || !endDate || !registrationDeadline) {
        return res.status(400).json({ error: 'Please provide all required event details.' });
      }

      if (new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({ error: 'End date must be strictly after start date.' });
      }

      if (new Date(registrationDeadline) > new Date(startDate)) {
        return res.status(400).json({ error: 'Registration deadline cannot be after the event start date.' });
      }

      // Check category exists
      const cat = await prisma.eventCategory.findUnique({
        where: { id: categoryId },
      });
      if (!cat) {
        return res.status(400).json({ error: 'Invalid event category.' });
      }

      // Normal organizers can create DRAFT or PENDING_APPROVAL. Admins can create directly as PUBLISHED.
      let finalStatus = status;
      if (req.user!.role !== 'ADMIN' && status === 'PUBLISHED') {
        finalStatus = 'PENDING_APPROVAL';
      }

      const newEvent = await prisma.event.create({
        data: {
          title: title.trim(),
          slug: slugify(title),
          description,
          shortDescription,
          categoryId,
          organizerId: req.user!.id,
          bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
          format,
          venue: venue?.trim() || null,
          onlineLink: onlineLink?.trim() || null,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          registrationDeadline: new Date(registrationDeadline),
          capacity: parseInt(capacity, 10),
          registrationType,
          minTeamSize: registrationType === 'TEAM' ? parseInt(minTeamSize, 10) : 1,
          maxTeamSize: registrationType === 'TEAM' ? parseInt(maxTeamSize, 10) : 1,
          eligibility,
          rules,
          prizes,
          status: finalStatus,
        },
        include: {
          category: true,
        },
      });

      await createAuditLog({
        actorId: req.user!.id,
        action: 'EVENT_CREATED',
        targetType: 'EVENT',
        targetId: newEvent.id,
        details: { title: newEvent.title, status: newEvent.status },
      });

      res.status(201).json({
        message:
          finalStatus === 'PENDING_APPROVAL'
            ? 'Event submitted for administrator review.'
            : 'Event created and published successfully.',
        event: newEvent,
      });
    } catch (error: any) {
      console.error('Create event error:', error);
      res.status(500).json({ error: 'Failed to create event.' });
    }
  }
);

// PATCH /api/events/:id
router.patch(
  '/:id',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const event = await prisma.event.findUnique({
        where: { id },
      });

      if (!event) {
        return res.status(404).json({ error: 'Event not found.' });
      }

      // Check ownership unless admin
      if (req.user!.role !== 'ADMIN' && event.organizerId !== req.user!.id) {
        return res.status(403).json({ error: 'You are only authorized to modify your own events.' });
      }

      const {
        title,
        description,
        shortDescription,
        categoryId,
        bannerUrl,
        format,
        venue,
        onlineLink,
        startDate,
        endDate,
        registrationDeadline,
        capacity,
        registrationType,
        minTeamSize,
        maxTeamSize,
        eligibility,
        rules,
        prizes,
        status,
        cancellationReason,
      } = req.body;

      const updateData: any = {};
      if (title) updateData.title = title.trim();
      if (description) updateData.description = description;
      if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
      if (categoryId) updateData.categoryId = categoryId;
      if (bannerUrl) updateData.bannerUrl = bannerUrl;
      if (format) updateData.format = format;
      if (venue !== undefined) updateData.venue = venue;
      if (onlineLink !== undefined) updateData.onlineLink = onlineLink;
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate) updateData.endDate = new Date(endDate);
      if (registrationDeadline) updateData.registrationDeadline = new Date(registrationDeadline);
      if (capacity !== undefined) updateData.capacity = parseInt(capacity, 10);
      if (registrationType) updateData.registrationType = registrationType;
      if (minTeamSize !== undefined) updateData.minTeamSize = parseInt(minTeamSize, 10);
      if (maxTeamSize !== undefined) updateData.maxTeamSize = parseInt(maxTeamSize, 10);
      if (eligibility !== undefined) updateData.eligibility = eligibility;
      if (rules !== undefined) updateData.rules = rules;
      if (prizes !== undefined) updateData.prizes = prizes;
      if (cancellationReason !== undefined) updateData.cancellationReason = cancellationReason;

      if (status) {
        // Only Admin can set to PUBLISHED directly from PENDING_APPROVAL
        if (status === 'PUBLISHED' && req.user!.role !== 'ADMIN' && event.status === 'PENDING_APPROVAL') {
          return res.status(403).json({ error: 'Only administrators can approve and publish events.' });
        }
        updateData.status = status;
      }

      const updated = await prisma.event.update({
        where: { id },
        data: updateData,
        include: { category: true },
      });

      await createAuditLog({
        actorId: req.user!.id,
        action: 'EVENT_UPDATED',
        targetType: 'EVENT',
        targetId: id,
        details: updateData,
      });

      res.json({ message: 'Event updated successfully.', event: updated });
    } catch (error: any) {
      console.error('Update event error:', error);
      res.status(500).json({ error: 'Failed to update event.' });
    }
  }
);

// POST /api/events/:id/submit-for-approval
router.post(
  '/:id/submit-for-approval',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const event = await prisma.event.findUnique({ where: { id } });

      if (!event) return res.status(404).json({ error: 'Event not found.' });
      if (req.user!.role !== 'ADMIN' && event.organizerId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized.' });
      }

      const updated = await prisma.event.update({
        where: { id },
        data: { status: 'PENDING_APPROVAL' },
      });

      // Notify platform admins
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await sendNotification({
          userId: admin.id,
          title: 'New Event Pending Approval',
          message: `Organizer submitted "${event.title}" for review.`,
          type: 'APPROVAL',
          link: '/admin/events',
        });
      }

      res.json({ message: 'Event submitted for administrator approval.', event: updated });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to submit event for approval.' });
    }
  }
);

// POST /api/events/:id/approve (Admin only)
router.post(
  '/:id/approve',
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { approved, notes } = req.body;

      const event = await prisma.event.findUnique({ where: { id } });
      if (!event) return res.status(404).json({ error: 'Event not found.' });

      const newStatus = approved ? 'PUBLISHED' : 'DRAFT';

      const updated = await prisma.event.update({
        where: { id },
        data: {
          status: newStatus,
          approvalNotes: notes || null,
        },
      });

      await sendNotification({
        userId: event.organizerId,
        title: approved ? 'Event Approved & Published! 🎉' : 'Event Changes Requested',
        message: approved
          ? `Your event "${event.title}" has been approved and is now live on TechFest Hub.`
          : `Your event submission for "${event.title}" requires revisions: ${notes || 'See organizer dashboard.'}`,
        type: 'APPROVAL',
        link: `/organizer/events`,
      });

      await createAuditLog({
        actorId: req.user!.id,
        action: approved ? 'EVENT_APPROVED' : 'EVENT_REJECTED',
        targetType: 'EVENT',
        targetId: id,
        details: { approved, notes },
      });

      res.json({
        message: approved ? 'Event approved and published.' : 'Event returned to draft status.',
        event: updated,
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to review event.' });
    }
  }
);

// DELETE /api/events/:id
router.delete(
  '/:id',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          _count: {
            select: { registrations: true },
          },
        },
      });

      if (!event) return res.status(404).json({ error: 'Event not found.' });
      if (req.user!.role !== 'ADMIN' && event.organizerId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized.' });
      }

      // If event already has registrations, soft cancel it with reason to preserve audit trail
      if (event._count.registrations > 0) {
        const cancelled = await prisma.event.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            cancellationReason: reason || 'Cancelled by organizer/admin.',
          },
        });

        // Notify registered students
        const regs = await prisma.registration.findMany({
          where: { eventId: id },
          select: { userId: true },
        });

        for (const reg of regs) {
          await sendNotification({
            userId: reg.userId,
            title: `Event Cancelled: ${event.title}`,
            message: `The event "${event.title}" has been cancelled. Reason: ${reason || 'Unforeseen circumstances.'}`,
            type: 'EVENT_CANCELLED',
            link: '/registrations',
          });
        }

        await createAuditLog({
          actorId: req.user!.id,
          action: 'EVENT_CANCELLED',
          targetType: 'EVENT',
          targetId: id,
          details: { reason },
        });

        return res.json({ message: 'Event has been cancelled and attendees notified.', event: cancelled });
      }

      // Otherwise hard delete if no attendees
      await prisma.event.delete({ where: { id } });

      await createAuditLog({
        actorId: req.user!.id,
        action: 'EVENT_DELETED',
        targetType: 'EVENT',
        targetId: id,
        details: { title: event.title },
      });

      res.json({ message: 'Event deleted successfully.' });
    } catch (error: any) {
      console.error('Delete event error:', error);
      res.status(500).json({ error: 'Failed to delete event.' });
    }
  }
);

export default router;
