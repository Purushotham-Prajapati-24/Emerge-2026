import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  title: string;
  language: string;
  projectType: 'programming' | 'web-development';
  owner: mongoose.Types.ObjectId;
  collaborators: {
    user: mongoose.Types.ObjectId;
    role: 'owner' | 'editor' | 'commenter' | 'reader';
  }[];
  files: any[];
  createdAt: Date;
}

const ProjectSchema: Schema = new Schema({
  title: { type: String, required: true },
  language: { type: String, default: 'typescript' },
  projectType: { type: String, enum: ['programming', 'web-development'], default: 'programming' },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['owner', 'editor', 'commenter', 'reader'], default: 'reader' }
  }],
  files: { type: Schema.Types.Mixed, default: [] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IProject>('Project', ProjectSchema);
