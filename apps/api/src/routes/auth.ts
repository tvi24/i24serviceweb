import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { getRepositories } from '../repositories';
import { login } from '../services/authService';
import { asyncHandler } from './asyncHandler';

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

authRouter.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const result = await login(getRepositories(), username, password);
    res.json(result);
  })
);

authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(req.user);
  })
);
