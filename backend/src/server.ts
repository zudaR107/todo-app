import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectMongo } from './db/index.js';

async function main() {
    try {
        await connectMongo(env.MONGO_URI);
        console.log('[INFO] Mongo connected');
    } catch (e) {
        console.error('[ERROR] Mongo connection failed:', (e as Error).message);
        process.exit(1);
    }

    const app = createApp();
    app.listen(env.PORT, () => console.log(`[INFO] API on :${env.PORT}`));
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
