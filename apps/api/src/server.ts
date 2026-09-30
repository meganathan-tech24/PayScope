import { createApp } from './app/app.js';
import { config } from './app/config/config.js';
import { logger } from './lib/logging/logger.js';

// Express 5 passes a startup failure (e.g. port in use) to this callback instead of throwing.
createApp().listen(config.PORT, (error?: Error) => {
  if (error) {
    logger.fatal('Server failed to start', {
      stack: error.stack,
      metadata: { port: config.PORT, reason: error.message },
    });
    process.exit(1);
  }
  logger.info('Server started', { metadata: { port: config.PORT, env: config.NODE_ENV } });
});
