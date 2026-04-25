import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import specialtyRoutes from './routes/specialtyRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://medibook-hamad.netlify.app',
  'https://medibook.hamadalkhalaf.com',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5501',
  'http://127.0.0.1:5501',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

const allowedOriginPatterns = [
  /^https:\/\/[a-z0-9-]+\.netlify\.app$/,
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman)
    if (!origin) return callback(null, true);
    // Allow exact matches
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any *.netlify.app subdomain
    if (allowedOriginPatterns.some((re) => re.test(origin))) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'MediBook API', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/specialties', specialtyRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/ai', aiRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ MediBook API running on http://localhost:${PORT}`);
});
