import { Response } from 'express';
import { z } from 'zod';
import Project from '../models/Project';
import User from '../models/User';
import Notification from '../models/Notification';
import { AuthRequest } from '../middlewares/auth.middleware';

const createProjectSchema = z.object({
  title: z.string().min(1).max(100),
  language: z.string().default('typescript'),
  projectType: z.enum(['programming', 'web-development']).default('programming'),
});

const updateProjectSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  language: z.string().optional(),
});

// POST /api/projects
export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { title, language, projectType } = createProjectSchema.parse(req.body);
    const userId = req.user!.userId;

    const project = await Project.create({
      title,
      language,
      projectType,
      owner: userId,
      collaborators: [{ user: userId, role: 'owner' }],
    });

    // Add project reference to user document
    await User.findByIdAndUpdate(userId, { $addToSet: { projects: project.id } });

    return res.status(201).json({ project });
  } catch (error: any) {
    if (error.name === 'ZodError') return res.status(400).json({ message: error.errors });
    return res.status(500).json({ message: 'Failed to create project' });
  }
};

// GET /api/projects — current user's projects
export const getUserProjects = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const projects = await Project.find({
      $or: [{ owner: userId }, { 'collaborators.user': userId }],
    })
      .populate('owner', 'name username avatar')
      .populate('collaborators.user', 'name username avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({ projects });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch projects' });
  }
};

// GET /api/projects/:id
export const getProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name username avatar')
      .populate('collaborators.user', 'name username avatar');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Fetch pending invitations for this project
    const pendingInvitations = await Notification.find({
      project: req.params.id,
      status: 'pending'
    }).populate('recipient', 'name username avatar');

    return res.status(200).json({ 
      project, 
      pendingInvitations: pendingInvitations.map(inv => ({
        user: inv.recipient,
        role: inv.role,
        sentAt: inv.createdAt
      }))
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch project' });
  }
};

// PATCH /api/projects/:id
export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { title, language } = updateProjectSchema.parse(req.body);
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.owner.toString() !== req.user!.userId) {
      return res.status(403).json({ message: 'Only the owner can update this project' });
    }

    if (title) project.title = title;
    if (language) project.language = language;
    await project.save();

    return res.status(200).json({ project });
  } catch (error: any) {
    if (error.name === 'ZodError') return res.status(400).json({ message: error.errors });
    return res.status(500).json({ message: 'Failed to update project' });
  }
};

// DELETE /api/projects/:id
export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.owner.toString() !== req.user!.userId) {
      return res.status(403).json({ message: 'Only the owner can delete this project' });
    }

    // Remove project ref from all collaborators
    const collaboratorIds = project.collaborators.map((c: any) => c.user.toString());
    await User.updateMany(
      { _id: { $in: collaboratorIds } },
      { $pull: { projects: project._id } }
    );

    // Cancel all pending invitations for this project
    await Notification.deleteMany({ project: project._id });

    await Project.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete project' });
  }
};

// POST /api/projects/:id/invite
export const inviteCollaborator = async (req: AuthRequest, res: Response) => {
  try {
    const { username, role } = req.body;
    if (!username) return res.status(400).json({ message: 'Username is required' });

    const validRoles = ['editor', 'commenter', 'reader'];
    const assignedRole = validRoles.includes(role) ? role : 'reader';

    const targetUser = await User.findOne({ username });
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Check requester is owner
    const isOwner = project.owner.toString() === req.user!.userId;
    if (!isOwner) return res.status(403).json({ message: 'Only the owner can invite collaborators' });

    // Avoid duplicate
    const alreadyIn = project.collaborators.some(
      (c: any) => c.user.toString() === targetUser.id
    );
    if (alreadyIn) return res.status(409).json({ message: 'User already a collaborator' });

    // Check for existing pending invitation
    const existingInvite = await Notification.findOne({
      recipient: targetUser._id,
      project: project._id,
      status: 'pending'
    });
    if (existingInvite) return res.status(409).json({ message: 'Invitation already pending' });

    // Create notification instead of immediate addition
    await Notification.create({
      recipient: targetUser._id,
      sender: req.user!.userId,
      project: project._id,
      role: assignedRole,
      type: 'invitation'
    });

    return res.status(200).json({ message: 'Invitation sent to user' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to invite collaborator' });
  }
};

// PATCH /api/projects/:id/collaborators/:userId
export const updateRole = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    const { id: projectId, userId } = req.params;

    const validRoles = ['editor', 'commenter', 'reader'];
    if (!validRoles.includes(role)) return res.status(400).json({ message: 'Invalid role' });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Check ownership
    if (project.owner.toString() !== req.user!.userId) {
      return res.status(403).json({ message: 'Only the owner can manage roles' });
    }

    // Update the collaborator's role
    const collaboratorIndex = project.collaborators.findIndex(c => c.user.toString() === userId);
    if (collaboratorIndex === -1) return res.status(404).json({ message: 'Collaborator not found' });

    project.collaborators[collaboratorIndex].role = role as any;
    await project.save();

    return res.status(200).json({ message: 'Role updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update role' });
  }
};

// DELETE /api/projects/:id/collaborators/:userId
export const removeCollaborator = async (req: AuthRequest, res: Response) => {
  try {
    const { id: projectId, userId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Check ownership
    if (project.owner.toString() !== req.user!.userId) {
      return res.status(403).json({ message: 'Only the owner can remove collaborators' });
    }

    // Safety: cannot remove owner
    if (userId === project.owner.toString()) {
      return res.status(400).json({ message: 'Cannot remove the owner' });
    }

    // Remove from project
    project.collaborators = project.collaborators.filter(c => c.user.toString() !== userId);
    await project.save();

    // Remove from user's projects list
    await User.findByIdAndUpdate(userId, { $pull: { projects: projectId } });

    return res.status(200).json({ message: 'Collaborator removed' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to remove collaborator' });
  }
};

// DELETE /api/projects/:id/invitations/:recipientId
export const cancelInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const { id: projectId, recipientId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Check ownership
    if (project.owner.toString() !== req.user!.userId) {
      return res.status(403).json({ message: 'Only the owner can cancel invitations' });
    }

    await Notification.deleteOne({
      project: projectId,
      recipient: recipientId,
      status: 'pending'
    });

    return res.status(200).json({ message: 'Invitation cancelled' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to cancel invitation' });
  }
};
