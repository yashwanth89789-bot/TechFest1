import { Router, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../db.ts';
import {
  hashPassword,
  comparePassword,
  generateToken,
  authenticate,
  AuthenticatedRequest,
  rateLimit,
  createAuditLog,
  sendNotification,
} from '../auth.ts';

const router = Router();

// POST /api/auth/register
router.post('/register', rateLimit(5, 60 * 1000), async (req, res) => {
  try {
    const { email, password, name, college, department, graduationYear, phoneNumber, studentIdNumber } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const emailNormalized = email.trim().toLowerCase();

    // Check if email already registered
    const existing = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await hashPassword(password);

    // Create user with guaranteed STUDENT role
    const newUser = await prisma.user.create({
      data: {
        email: emailNormalized,
        passwordHash,
        name: name.trim(),
        role: 'STUDENT',
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
        profile: {
          create: {
            college: college?.trim() || null,
            department: department?.trim() || null,
            graduationYear: graduationYear ? parseInt(graduationYear, 10) : null,
            phoneNumber: phoneNumber?.trim() || null,
            studentIdNumber: studentIdNumber?.trim() || null,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role as any,
      isSuspended: false,
    });

    // Send welcome notification
    await sendNotification({
      userId: newUser.id,
      title: 'Welcome to TechFest Hub! 🚀',
      message: 'Your account is ready. Discover college hackathons, coding contests, and workshops now!',
      type: 'GENERAL',
      link: '/events',
    });

    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        avatarUrl: newUser.avatarUrl,
        profile: newUser.profile,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', rateLimit(10, 60 * 1000), async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const emailNormalized = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: emailNormalized },
      include: { profile: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: 'This account has been suspended. Please contact campus administrators.' });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      isSuspended: user.isSuspended,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Signed in successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        profile: user.profile,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Signed out successfully.' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        profile: true,
        _count: {
          select: {
            registrations: true,
            notifications: {
              where: { isRead: false },
            },
            certificates: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        profile: user.profile,
        unreadNotificationsCount: user._count.notifications,
        totalRegistrationsCount: user._count.registrations,
        certificatesCount: user._count.certificates,
      },
    });
  } catch (error: any) {
    console.error('Fetch me error:', error);
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// PATCH /api/auth/profile
router.patch('/profile', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, college, department, graduationYear, phoneNumber, studentIdNumber, githubUrl, linkedinUrl, bio, skills } = req.body;

    if (name) {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { name: name.trim() },
      });
    }

    const updatedProfile = await prisma.profile.upsert({
      where: { userId: req.user!.id },
      create: {
        userId: req.user!.id,
        college,
        department,
        graduationYear: graduationYear ? parseInt(graduationYear, 10) : null,
        phoneNumber,
        studentIdNumber,
        githubUrl,
        linkedinUrl,
        bio,
        skills,
      },
      update: {
        college,
        department,
        graduationYear: graduationYear ? parseInt(graduationYear, 10) : null,
        phoneNumber,
        studentIdNumber,
        githubUrl,
        linkedinUrl,
        bio,
        skills,
      },
    });

    res.json({ message: 'Profile updated successfully.', profile: updatedProfile });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', rateLimit(5, 60 * 1000), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return res.json({
        message: 'If an account exists with that email, a password reset link has been dispatched.',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    res.json({
      message: 'If an account exists with that email, a password reset link has been dispatched.',
      demoResetToken: token,
      resetUrl: `/reset-password?token=${token}`,
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', rateLimit(5, 60 * 1000), async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Password reset link is invalid or has expired.' });
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await createAuditLog({
      actorId: resetRecord.userId,
      action: 'PASSWORD_RESET',
      targetType: 'USER',
      targetId: resetRecord.userId,
      details: { email: resetRecord.user.email },
    });

    res.json({ message: 'Password has been updated successfully. You can now sign in with your new password.' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

export default router;
