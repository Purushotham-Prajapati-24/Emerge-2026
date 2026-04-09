import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { AuthRequest } from '../middlewares/auth.middleware';

const generateTokens = (userId: string) => {
  const jwtSecret = process.env.JWT_SECRET as string;
  const refreshSecret = process.env.REFRESH_SECRET as string;
  
  const accessToken = jwt.sign({ userId }, jwtSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, refreshSecret, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Allow cross-origin AJAX on localhost
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// POST /api/auth/register — Email/password signup
export const register = async (req: Request, res: Response) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ message: 'Email or username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, username, email, password: hashedPassword });

    const { accessToken, refreshToken } = generateTokens(user.id);
    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      accessToken,
      needsOnboarding: true,
      user: { id: user.id, name: user.name, username: user.username, email: user.email, avatar: user.avatar, skills: [] },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed' });
  }
};

// POST /api/auth/login — Email/password login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const { accessToken, refreshToken } = generateTokens(user.id);
    setRefreshCookie(res, refreshToken);

    return res.status(200).json({
      accessToken,
      user: { id: user.id, name: user.name, username: user.username, email: user.email, avatar: user.avatar },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed' });
  }
};

// POST /api/auth/clerk-sync — Called after Clerk OAuth, creates/finds MongoDB user
export const clerkSync = async (req: Request, res: Response) => {
  try {
    const { clerkId, email, name, avatar } = req.body;
    if (!clerkId || !email) return res.status(400).json({ message: 'clerkId and email required' });

    // Generate a safe default username from email
    const defaultUsername = email.split('@')[0].replace(/[^a-z0-9_]/g, '_').toLowerCase();

    let user = await User.findOne({ clerkId });
    if (!user) {
      // Check if email already exists (email-based account upgrading to OAuth)
      user = await User.findOne({ email });
      if (user) {
        user.clerkId = clerkId;
        if (avatar && !user.avatar) user.avatar = avatar;
        await user.save();
      } else {
        // Fresh OAuth user — may need onboarding to set username
        const uniqueUsername = await ensureUniqueUsername(defaultUsername);
        user = await User.create({
          clerkId, email, name: name || defaultUsername,
          username: uniqueUsername, avatar: avatar || '',
        });
      }
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    setRefreshCookie(res, refreshToken);

    return res.status(200).json({
      accessToken,
      user: { id: user.id, name: user.name, username: user.username, email: user.email, avatar: user.avatar, skills: user.skills || [] },
      needsOnboarding: !user.username || user.username === defaultUsername,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Clerk sync failed' });
  }
};

// POST /api/auth/onboard — Set username/bio/socialLinks/skills after OAuth signup
export const completeOnboarding = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { username, bio, socialLinks, skills } = req.body;

    if (!username) return res.status(400).json({ message: 'Username is required' });

    const existing = await User.findOne({ username });
    if (existing && existing.id !== userId) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        username,
        bio: bio || '',
        socialLinks: socialLinks || {},
        skills: Array.isArray(skills) ? skills.slice(0, 20) : [],
      },
      { new: true }
    ).select('-password');

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Onboarding failed' });
  }
};

// POST /api/auth/refresh — Rotate access token using httpOnly refresh cookie
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    const decoded = jwt.verify(token, process.env.REFRESH_SECRET as string) as { userId: string };
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });

    const { accessToken, refreshToken: newRefresh } = generateTokens(user.id);
    setRefreshCookie(res, newRefresh);

    return res.status(200).json({
      accessToken,
      user: { id: user.id, name: user.name, username: user.username, email: user.email, avatar: user.avatar },
    });
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};

// POST /api/auth/logout
export const logout = async (_req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  return res.status(200).json({ message: 'Logged out successfully' });
};

// Helper — ensures unique username with suffix
async function ensureUniqueUsername(base: string): Promise<string> {
  let username = base;
  let counter = 0;
  while (await User.findOne({ username })) {
    counter++;
    username = `${base}${counter}`;
  }
  return username;
}
