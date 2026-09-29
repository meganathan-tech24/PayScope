import { createApp } from './app/app.js';
import { config } from './app/config/config.js';
import { logger } from './lib/logging/logger.js';

createApp().listen(config.PORT, () => {
  logger.info('Server started', { metadata: { port: config.PORT, env: config.NODE_ENV } });
});
