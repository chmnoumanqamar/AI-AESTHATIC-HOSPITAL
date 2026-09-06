import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/env.config';
import { BRAND_TOKENS } from './config/colors.config';
import { logger } from './common/utils/logger';
import { errorHandler } from './common/errors/error-handler';

// Routes
import authRoutes from './modules/auth/auth.routes';
import patientRoutes from './modules/patient/patient.routes';
import doctorRoutes from './modules/doctor/doctor.routes';
import serviceRoutes from './modules/service/service.routes';
import tokenRoutes from './modules/token/token.routes';
import appointmentRoutes from './modules/appointment/appointment.routes';
import queueRoutes from './modules/queue/queue.routes';
import clinicalRoutes from './modules/clinical/clinical.routes';
import billingRoutes from './modules/billing/billing.routes';
import notificationRoutes from './modules/notification/notification.routes';
import auditRoutes from './modules/audit/audit.routes';
import adminRoutes from './modules/admin/admin.routes';
import reportsRoutes from './modules/reports/reports.routes';
import whatsappRoutes from './modules/ai-agent/whatsapp.routes';
import { aiController } from './modules/ai-agent/ai.controller';
import { authMiddleware } from './common/middleware/auth.middleware';

const app = express();

// Security & Parsing Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin or any localhost origin for port-isolated terminals
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1):[0-9]+$/.test(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Health Check & Brand Metadata
app.get('/health', (_req, res) => {
  res.json({
    status: 'HEALTHY',
    system: 'HOSPITAL MANAGEMENT & AI AGENT SYSTEM',
    brandTokens: BRAND_TOKENS,
    timestamp: new Date().toISOString()
  });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/clinical-records', clinicalRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/ai/whatsapp', whatsappRoutes);

// AI Chat Endpoint (Optional Auth so guests can explore or authenticated patients get full context)
app.post('/api/ai/chat', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authMiddleware(req, res, () => aiController.chat(req, res, next));
  }
  return aiController.chat(req, res, next);
});

// Global Error Handler Middleware
app.use(errorHandler);

// Start Server
const server = app.listen(ENV.PORT, () => {
  logger.info(`================================================================`);
  logger.info(`🏥 HOSPITAL MANAGEMENT & AI AGENT SYSTEM`);
  logger.info(`🚀 Server running on port ${ENV.PORT} [${ENV.NODE_ENV}]`);
  logger.info(`🎨 Brand Tokens Active: #E0FBFC | #C2DFE3 | #9DB4C0 | #5C6B73 | #253237`);
  logger.info(`🔗 API Base: ${ENV.API_BASE_URL}`);
  logger.info(`================================================================`);
});

export default app;
