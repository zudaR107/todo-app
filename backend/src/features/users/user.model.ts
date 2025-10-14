import { Schema, model, InferSchemaType } from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema(
    {
        email: { type: String, unique: true, index: true, required: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ['superadmin', 'user'], default: 'user', required: true},
        displayName: { type: String },
        telegramChatId: { type: String }
    },
    { timestamps: true }
);

UserSchema.methods.comparePassword = async function (plain: string) {
    return bcrypt.compare(plain, this.passwordHash);
}

export type UserDoc = InferSchemaType<typeof UserSchema> & {
    comparePassword: (plain: string) => Promise<boolean>;
}

export const User = model<UserDoc>('User', UserSchema);