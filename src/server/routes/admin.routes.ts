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

// Require ADMIN role for all routes in this file
router.use(authenticate, requireRole('ADMIN'));

// GET /api/admin/analytics
router.get('/analytics', async (_req, res: Response) => {
  try {
    const [
      totalUsers,
      studentCount,
      organizerCount,
      adminCount,
      totalEvents,
      pendingEvents,
      publishedEvents,
      completedEvents,
      totalRegistrations,
      confirmedRegistrations,
      waitlistedRegistrations,
      totalAttendances,
      totalCertificates,
      categories,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'ORGANIZER' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.event.count(),
      prisma.event.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.event.count({ where: { status: 'PUBLISHED' } }),
      prisma.event.count({ where: { status: 'COMPLETED' } }),
      prisma.registration.count(),
      prisma.registration.count({ where: { status: 'CONFIRMED' } }),
      prisma.registration.count({ where: { status: 'WAITLISTED' } }),
      prisma.attendance.count(),
      prisma.certificate.count(),
      prisma.eventCategory.findMany({
        include: {
          _count: {
            select: { events: true },
          },
        },
      }),
    ]);

    // Compute category distribution with total participants
    const categoryStats = await Promise.all(
      categories.map(async (cat) => {
        const regCount = await prisma.registration.count({
          where: {
            event: { categoryId: cat.id },
            status: 'CONFIRMED',
          },
        });
        return {
          name: cat.name,
          eventCount: cat._count.events,
          registrations: regCount,
        };
      })
    );

    // Compute attendance percentage
    const attendanceRate =
      confirmedRegistrations > 0
        ? Math.round((totalAttendances / confirmedRegistrations) * 100)
        : 0;

    // Build 7-day registration trend data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentRegistrations = await prisma.registration.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
    });

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trendMap: Record<string, number> = {};

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = `${dayLabels[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
      trendMap[key] = 0;
    }

    for (const r of recentRegistrations) {
      const d = new Date(r.createdAt);
      const key = `${dayLabels[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
      if (trendMap[key] !== undefined) {
        trendMap[key]++;
      }
    }

    const registrationTrends = Object.entries(trendMap).map(([day, count]) => ({
      day,
      registrations: count,
    }));

    res.json({
      overview: {
        totalUsers,
        studentCount,
        organizerCount,
        adminCount,
        totalEvents,
        pendingEvents,
        publishedEvents,
        completedEvents,
        totalRegistrations,
        confirmedRegistrations,
        waitlistedRegistrations,
        totalAttendances,
        attendanceRate,
        totalCertificates,
      },
      categoryStats,
      registrationTrends,
    });
  } catch (error: any) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ error: 'Failed to compute platform analytics.' });
  }
});

// GET /api/admin/users
router.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, role, page = '1', limit = '20' } = req.query as Record<string, string | undefined>;
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));
    const skip = (pageNum - 1) * pageSize;

    const where: any = {};
    if (role && ['STUDENT', 'ORGANIZER', 'ADMIN'].includes(role)) {
      where.role = role;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { profile: { college: { contains: q } } },
        { profile: { department: { contains: q } } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isSuspended: true,
          avatarUrl: true,
          createdAt: true,
          profile: true,
          _count: {
            select: {
              registrations: true,
              organizedEvents: true,
              certificates: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['STUDENT', 'ORGANIZER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required (STUDENT, ORGANIZER, ADMIN).' });
    }

    if (id === req.user!.id && role !== 'ADMIN') {
      return res.status(400).json({ error: 'You cannot demote your own administrator account.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    await sendNotification({
      userId: id,
      title: 'Platform Role Updated',
      message: `Your account role has been updated to ${role} by a platform administrator.`,
      type: 'ROLE_UPDATE',
      link: role === 'ORGANIZER' ? '/organizer' : '/dashboard',
    });

    await createAuditLog({
      actorId: req.user!.id,
      action: 'ROLE_UPDATED',
      targetType: 'USER',
      targetId: id,
      details: { previousRole: targetUser.role, newRole: role, userEmail: targetUser.email },
    });

    res.json({ message: `Role for ${targetUser.name} updated to ${role}.`, user: updated });
  } catch (error: any) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role.' });
  }
});

// PATCH /api/admin/users/:id/suspend
router.patch('/users/:id/suspend', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isSuspended, reason } = req.body;

    if (id === req.user!.id) {
      return res.status(400).json({ error: 'You cannot suspend your own account.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });

    const updated = await prisma.user.update({
      where: { id },
      data: { isSuspended: Boolean(isSuspended) },
      select: { id: true, name: true, email: true, isSuspended: true },
    });

    await createAuditLog({
      actorId: req.user!.id,
      action: isSuspended ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
      targetType: 'USER',
      targetId: id,
      details: { reason, email: targetUser.email },
    });

    res.json({
      message: isSuspended
        ? `Account for ${targetUser.name} has been suspended.`
        : `Account for ${targetUser.name} has been reactivated.`,
      user: updated,
    });
  } catch (error: any) {
    console.error('Suspend user error:', error);
    res.status(500).json({ error: 'Failed to update user suspension status.' });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = '1', limit = '30', action } = req.query as Record<string, string | undefined>;
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit || '30', 10)));
    const skip = (pageNum - 1) * pageSize;

    const where: any = {};
    if (action) {
      where.action = action;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error('Fetch audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
});

// POST /api/admin/categories
router.post('/categories', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, icon, color } = req.body;

    if (!name) return res.status(400).json({ error: 'Category name is required.' });

    const slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_-]+/g, '-');

    const newCat = await prisma.eventCategory.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        icon: icon || 'Sparkles',
        color: color || 'indigo',
      },
    });

    await createAuditLog({
      actorId: req.user!.id,
      action: 'CATEGORY_CREATED',
      targetType: 'CATEGORY',
      targetId: newCat.id,
      details: { name: newCat.name, slug: newCat.slug },
    });

    res.status(201).json({ message: 'Event category created.', category: newCat });
  } catch (error: any) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category.' });
  }
});

export default router;
