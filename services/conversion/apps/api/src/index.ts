import { env } from './env.js';
import { buildServer } from './server.js';
import { configureBucketCors } from './services/storage.js';
import { startCleanupScheduler } from './services/cleanup.js';

const app = buildServer();

try {
  await app.listen({
    port: env.CONVERSION_API_PORT,
    host: '0.0.0.0'
  });

  if (env.S3_CONFIGURE_CORS) {
    const origins = env.S3_ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
    configureBucketCors(origins).catch((err) =>
      app.log.warn({ err }, 'S3 CORS configuration failed — continuing without CORS rules')
    );
  }

  startCleanupScheduler(app.log);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
