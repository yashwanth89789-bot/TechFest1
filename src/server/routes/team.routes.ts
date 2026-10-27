import { Router, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../db.ts';
import {
  authenticate,
  AuthenticatedRequest,
  createAuditLog,
  sendNotification,
} from '../auth.ts';

const router = Router();

function generateTeamCode(teamName: string): string {
  const prefix = teamName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'TEAM';
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${rand}`;
}

// POST /api/teams (Create team)
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, eventId } = req.body;
    const userId = req.user!.id;

    if (!name || !eventId) {
      return res.status(400).json({ error: 'Team name and event ID are required.' });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) return res.status(404).json({ error: 'Event not found.' });

    if (event.registrationType !== 'TEAM') {
      return res.status(400).json({ error: 'This event only accepts individual registrations.' });
    }

    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ error: 'Registration deadline has passed for this event.' });
    }

    // Check if user is already leading or a member of a team for this event
    const existingMembership = await prisma.teamMembership.findFirst({
      where: {
        userId,
        team: { eventId },
      },
      include: { team: true },
    });

    if (existingMembership) {
      return res.status(400).json({
        error: `You are already a member of team "${existingMembership.team.name}" for this event.`,
      });
    }

    const code = generateTeamCode(name);

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        code,
        eventId,
        leaderId: userId,
        members: {
          create: {
            userId,
            role: 'LEADER',
          },
        },
      },
      include: {
        event: { select: { id: true, title: true, maxTeamSize: true, minTeamSize: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
    });

    await createAuditLog({
      actorId: userId,
      action: 'TEAM_CREATED',
      targetType: 'TEAM',
      targetId: team.id,
      details: { teamName: team.name, code: team.code, eventId },
    });

    res.status(201).json({
      message: `Team "${team.name}" created! Share code ${team.code} with your teammates.`,
      team,
    });
  } catch (error: any) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Failed to create team.' });
  }
});

// POST /api/teams/join (Join team using join code)
router.post('/join', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code } = req.body;
    const userId = req.user!.id;

    if (!code) return res.status(400).json({ error: 'Team join code is required.' });

    const team = await prisma.team.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: {
        event: true,
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!team) return res.status(404).json({ error: 'Invalid team join code. Please double-check with your team leader.' });

    if (team.members.length >= team.event.maxTeamSize) {
      return res.status(400).json({
        error: `This team has reached the maximum size limit of ${team.event.maxTeamSize} members.`,
      });
    }

    // Check if user is already a member
    if (team.members.some((m) => m.userId === userId)) {
      return res.status(400).json({ error: 'You are already a member of this team.' });
    }

    // Check if user is already in another team for the same event
    const otherTeamMembership = await prisma.teamMembership.findFirst({
      where: {
        userId,
        team: { eventId: team.eventId },
      },
      include: { team: true },
    });

    if (otherTeamMembership) {
      return res.status(400).json({
        error: `You are already part of team "${otherTeamMembership.team.name}" for this event. Leave that team first to join this one.`,
      });
    }

    // Add member
    const newMembership = await prisma.teamMembership.create({
      data: {
        teamId: team.id,
        userId,
        role: 'MEMBER',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify team leader
    await sendNotification({
      userId: team.leaderId,
      title: 'New Teammate Joined! 👥',
      message: `${req.user!.name} has joined your team "${team.name}" for ${team.event.title}.`,
      type: 'TEAM',
      link: '/teams',
    });

    res.json({
      message: `You have successfully joined "${team.name}"!`,
      membership: newMembership,
      team,
    });
  } catch (error: any) {
    console.error('Join team error:', error);
    res.status(500).json({ error: 'Failed to join team.' });
  }
});

// GET /api/teams/me
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: { userId: req.user!.id },
        },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            startDate: true,
            endDate: true,
            minTeamSize: true,
            maxTeamSize: true,
            status: true,
            capacity: true,
          },
        },
        leader: {
          select: { id: true, name: true, email: true },
        },
        members: {
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
          },
        },
        invitations: {
          where: { status: 'PENDING' },
          include: {
            invitee: { select: { id: true, name: true, email: true } },
          },
        },
        registrations: {
          where: { userId: req.user!.id },
          include: { ticket: true },
        },
      },
    });

    // Also fetch received invitations
    const pendingInvitations = await prisma.teamInvitation.findMany({
      where: {
        inviteeId: req.user!.id,
        status: 'PENDING',
      },
      include: {
        team: {
          include: {
            event: { select: { id: true, title: true } },
            leader: { select: { id: true, name: true, email: true } },
            members: {
              include: { user: { select: { id: true, name: true } } },
            },
          },
        },
        inviter: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({
      teams,
      pendingInvitations,
    });
  } catch (error: any) {
    console.error('Fetch my teams error:', error);
    res.status(500).json({ error: 'Failed to retrieve teams.' });
  }
});

// POST /api/teams/:id/invitations (Leader invites by email)
router.post('/:id/invitations', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: teamId } = req.params;
    const { email } = req.body;
    const userId = req.user!.id;

    if (!email) return res.status(400).json({ error: 'Invitee email is required.' });

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        event: true,
        members: true,
      },
    });

    if (!team) return res.status(404).json({ error: 'Team not found.' });

    if (team.leaderId !== userId) {
      return res.status(403).json({ error: 'Only the team leader can send invitations.' });
    }

    if (team.members.length >= team.event.maxTeamSize) {
      return res.status(400).json({ error: `Team has reached maximum capacity (${team.event.maxTeamSize} members).` });
    }

    // Find invitee user
    const invitee = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!invitee) {
      return res.status(404).json({
        error: `No registered student found with email "${email}". Make sure they have created an account on TechFest Hub.`,
      });
    }

    if (invitee.id === userId) {
      return res.status(400).json({ error: 'You cannot invite yourself.' });
    }

    // Check if already in this team
    if (team.members.some((m) => m.userId === invitee.id)) {
      return res.status(400).json({ error: `${invitee.name} is already a member of this team.` });
    }

    // Create or update invitation
    const invitation = await prisma.teamInvitation.upsert({
      where: {
        teamId_inviteeId: {
          teamId,
          inviteeId: invitee.id,
        },
      },
      create: {
        teamId,
        inviterId: userId,
        inviteeId: invitee.id,
        status: 'PENDING',
      },
      update: {
        status: 'PENDING',
      },
    });

    // Send in-app notification to invitee
    await sendNotification({
      userId: invitee.id,
      title: `Team Invitation: "${team.name}"`,
      message: `${req.user!.name} invited you to join team "${team.name}" for ${team.event.title}.`,
      type: 'TEAM',
      link: '/teams',
    });

    res.status(201).json({
      message: `Invitation dispatched to ${invitee.name} (${invitee.email}).`,
      invitation,
    });
  } catch (error: any) {
    console.error('Send invitation error:', error);
    res.status(500).json({ error: 'Failed to send invitation.' });
  }
});

// POST /api/invitations/:id/respond (Accept or Decline invitation)
router.post('/invitations/:id/respond', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { accept } = req.body;
    const userId = req.user!.id;

    const invitation = await prisma.teamInvitation.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            event: true,
            members: true,
          },
        },
      },
    });

    if (!invitation) return res.status(404).json({ error: 'Invitation not found.' });

    if (invitation.inviteeId !== userId) {
      return res.status(403).json({ error: 'Not authorized to respond to this invitation.' });
    }

    if (!accept) {
      await prisma.teamInvitation.update({
        where: { id },
        data: { status: 'DECLINED' },
      });

      await sendNotification({
        userId: invitation.inviterId,
        title: 'Team Invitation Declined',
        message: `${req.user!.name} declined your invitation to join "${invitation.team.name}".`,
        type: 'TEAM',
        link: '/teams',
      });

      return res.json({ message: 'Invitation declined.' });
    }

    // If accepting, verify capacity and membership
    if (invitation.team.members.length >= invitation.team.event.maxTeamSize) {
      return res.status(400).json({ error: 'This team is now full.' });
    }

    await prisma.$transaction([
      prisma.teamMembership.create({
        data: {
          teamId: invitation.teamId,
          userId,
          role: 'MEMBER',
        },
      }),
      prisma.teamInvitation.update({
        where: { id },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    await sendNotification({
      userId: invitation.team.leaderId,
      title: 'Invitation Accepted! 🎉',
      message: `${req.user!.name} accepted your invite and joined "${invitation.team.name}".`,
      type: 'TEAM',
      link: '/teams',
    });

    res.json({ message: `You have joined "${invitation.team.name}"!` });
  } catch (error: any) {
    console.error('Respond invitation error:', error);
    res.status(500).json({ error: 'Failed to respond to invitation.' });
  }
});

export default router;
