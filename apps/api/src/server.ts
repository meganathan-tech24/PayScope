import { createApp } from './app/app.js';

const port = Number(process.env.PORT) || 4000;

createApp().listen(port);
