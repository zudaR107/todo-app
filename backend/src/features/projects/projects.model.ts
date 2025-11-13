import type { Types, InferSchemaType } from 'mongoose';
import { Schema, model } from 'mongoose';

const projectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    color: { type: String, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

projectSchema.index({ ownerId: 1 });

export type ProjectDoc = InferSchemaType<typeof projectSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Project = model<ProjectDoc>('Project', projectSchema);
