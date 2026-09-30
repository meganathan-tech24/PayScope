// Run before destructive db scripts (db:reset) so a production URL fails before anything is dropped.
import { loadEnvFile } from '../lib/load-env.js';

import { assertSeedAllowed } from './guard.js';

loadEnvFile('.env');
assertSeedAllowed(process.env);
