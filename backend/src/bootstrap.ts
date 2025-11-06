import { env } from './config/env.js';
import { UserModel } from './features/users/user.model.js';

export async function bootstrapSuperadmin() {
  try {
    const count = await UserModel.estimatedDocumentCount();
    if (count > 0) return;

    if (!env.ALLOW_BOOTSTRAP) return;
    if (!env.BOOTSTRAP_SUPERADMIN_EMAIL || !env.BOOTSTRAP_SUPERADMIN_PASSWORD) {
      console.warn('[WARN] Bootstrap enabled but BOOTSTRAP_SUPERADMIN_* not set. Skipping.');
      return;
    }

    const exists = await UserModel.findOne({ email: env.BOOTSTRAP_SUPERADMIN_EMAIL }).lean().exec();
    if (exists) return;

    const admin = new UserModel({
      email: env.BOOTSTRAP_SUPERADMIN_EMAIL,
      displayName: 'Super Admin',
      password: env.BOOTSTRAP_SUPERADMIN_PASSWORD,
      role: 'superadmin',
    });

    await admin.save();
    console.log('[INFO] Bootstrap superadmin created:', admin.email);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[WARN] Bootstrap failed:', msg);
  }
}
