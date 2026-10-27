import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.routes.ts';
import eventRoutes from './routes/event.routes.ts';
import registrationRoutes from './routes/registration.routes.ts';
import teamRoutes from './routes/team.routes.ts';
import attendanceRoutes from './routes/attendance.routes.ts';
import certificateRoutes from './routes/certificate.routes.ts';
import notificationRoutes from './routes/notification.routes.ts';
import adminRoutes from './routes/admin.routes.ts';
import statsRoutes from './routes/stats.routes.ts';

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mount API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/events', attendanceRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'TechFest Hub API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'connected',
  });
});

export default app;
