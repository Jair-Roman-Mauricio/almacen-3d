import { createApplication } from './create-application.js';

const app = await createApplication();
app.enableShutdownHooks();
await app.listen(Number(process.env.API_PORT ?? 3001), process.env.API_HOST ?? '127.0.0.1');
