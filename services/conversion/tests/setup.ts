// Default env vars for tests. Values point at the local docker-compose stack so
// infra-dependent tests automatically light up when the stack is running.
// Individual env vars are NOT overwritten if already set in the environment
// (e.g. CI can inject its own DATABASE_URL).
const def = (key: string, val: string) => {
  if (process.env[key] === undefined) process.env[key] = val;
};

def('DATABASE_URL', 'postgres://conversion:conversion@localhost:5433/conversion');
def('REDIS_URL', 'redis://localhost:6380');
def('S3_ENDPOINT', 'http://localhost:9000');
def('S3_ACCESS_KEY_ID', 'minioadmin');
def('S3_SECRET_ACCESS_KEY', 'minioadmin');
def('S3_BUCKET', 'webwidgets-conversions');
def('CONVERSION_MAX_FILE_BYTES', '52428800');
def('CONVERSION_MAX_OUTPUT_BYTES', '104857600');
def('CONVERSION_COMMAND_TIMEOUT_MS', '30000');
def('WORKER_CONCURRENCY', '2');
def('WORKER_LOCK_DURATION_MS', '300000');
def('S3_CONFIGURE_CORS', 'false');
def('S3_ALLOWED_ORIGINS', '*');
def('CONVERSION_OBJECT_TTL_DAYS', '7');
def('CLEANUP_INTERVAL_MS', '3600000');
def('CONVERSION_RATE_LIMIT_MAX', '20');
def('CONVERSION_RATE_LIMIT_WINDOW_MS', '60000');
def('IMAGE_WORKER_CONCURRENCY', '4');
def('IMAGE_CONVERSION_TIMEOUT_MS', '60000');
def('IMAGE_MAX_OUTPUT_BYTES', '104857600');
def('IMAGE_JPEG_QUALITY', '90');
def('IMAGE_WEBP_QUALITY', '85');
def('IMAGE_PRESERVE_METADATA', 'false');
