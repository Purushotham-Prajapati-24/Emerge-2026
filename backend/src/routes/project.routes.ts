import { Router } from 'express';
import {
  createProject,
  getUserProjects,
  getProject,
  updateProject,
  deleteProject,
  inviteCollaborator,
  updateRole,
  removeCollaborator,
  cancelInvitation,
} from '../controllers/project.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// All project routes require authentication
router.use(verifyToken);

router.post('/', createProject);
router.get('/', getUserProjects);
router.get('/:id', getProject);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/invite', inviteCollaborator);
router.patch('/:id/collaborators/:userId', updateRole);
router.delete('/:id/collaborators/:userId', removeCollaborator);
router.delete('/:id/invitations/:recipientId', cancelInvitation);

export default router;
