import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false, minlength: 6 },
    role: { type: String, enum: ['superadmin', 'user'], default: 'user' },
  },
  { timestamps: true },
);

type User = InferSchemaType<typeof userSchema>;
type UserDoc = HydratedDocument<User>;

userSchema.pre('save', async function (this: UserDoc, next) {
  if (!this.isModified('password')) return next();
  const raw = this.get('password');
  if (typeof raw !== 'string') return next(new TypeError('Password must be a string'));
  const hash = await bcrypt.hash(raw, 12);
  this.set('password', hash);
  next();
});

export const UserModel = model<User>('User', userSchema);
