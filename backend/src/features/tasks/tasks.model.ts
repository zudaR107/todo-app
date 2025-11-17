import type { Types, InferSchemaType } from 'mongoose';
import { Schema, model } from 'mongoose';

const taskSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true },
    status: { type: String, enum: ['todo', 'doing', 'done'], default: 'todo', index: true },
    priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal', index: true },
    tags: { type: [String], default: [] },
    startAt: { type: Date },
    dueAt: { type: Date, index: true },
    allDay: { type: Boolean },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

taskSchema.index({ projectId: 1, status: 1, updatedAt: -1 });
taskSchema.index({ projectId: 1, dueAt: 1 });

export type TaskDoc = InferSchemaType<typeof taskSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Task = model<TaskDoc>('Task', taskSchema);
