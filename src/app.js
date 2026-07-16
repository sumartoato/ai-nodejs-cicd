const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const httpLogger = require('./middleware/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { success } = require('./utils/response');

// ── Express App ──
const app = express();

// ── Security ──
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// ── Rate Limiting ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// ── Body Parsing ──
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Compression ──
app.use(compression());

// ── Logging ──
app.use(httpLogger);

// ── Health Check (no auth) ──
app.get('/health', (req, res) => {
  res.json(success({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    node: process.version,
    env: process.env.NODE_ENV
  }, 'Server is healthy'));
});

// ── API Routes ──
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

// ── Swagger Docs (optional) ──
try {
  const swaggerUi = require('swagger-ui-express');
  const YAML = require('yamljs');
  const swaggerDocument = YAML.load('./swagger.yaml');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  // Swagger not available — skip
}

// ── Error Handling ──
app.use(notFound);
app.use(errorHandler);

module.exports = app;
