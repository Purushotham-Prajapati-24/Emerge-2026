import { Router } from 'express';
import { getSuggestion, getChatResponse, getTerminalAnalysis, getWebGeneration } from '../controllers/ai.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import rateLimit from 'express-rate-limit';

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: 'Too many AI requests. Slow down a bit.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post('/suggest', verifyToken, aiLimiter, getSuggestion);
router.post('/chat', verifyToken, aiLimiter, getChatResponse);
router.post('/web-generate', verifyToken, aiLimiter, getWebGeneration);
router.post('/analyze-terminal', verifyToken, aiLimiter, getTerminalAnalysis);

export default router;
