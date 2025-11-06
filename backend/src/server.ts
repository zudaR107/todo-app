import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectMongo } from './db/index.js';
import { bootstrapSuperadmin } from './bootstrap.js';

async function main() {
  try {
    await connectMongo(env.MONGO_URI);
    console.log('[INFO] Mongo connected');

    await bootstrapSuperadmin();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[ERROR] Mongo/bootstrap error:', msg);
  }

  const app = createApp();
  app.listen(env.PORT, () => console.log(`[INFO] API on :${env.PORT}`));
}

main().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error('[FATAL]', msg);
  process.exit(1);
});
