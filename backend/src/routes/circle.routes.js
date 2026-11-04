import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Circle } from '../models/Circle.js';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/require-auth.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({ name: z.string().trim().min(2).max(60) });
const inviteSchema = z.object({
  email: z.string().trim().email().max(254).transform(v => v.toLowerCase()),
  permissions: z.object({
    canShop: z.boolean().optional(),
    canPay: z.boolean().optional(),
    canReceive: z.boolean().optional(),
    autoApprove: z.boolean().optional(),
    perTransactionLimit: z.number().min(0).max(1000000).optional(),
    dailyLimit: z.number().min(0).max(10000000).optional(),
    currency: z.string().length(3).transform(v => v.toUpperCase()).optional(),
  }).optional(),
});
const permissionsSchema = inviteSchema.shape.permissions.unwrap();

function memberView(member) {
  return {
    id: member._id.toString(),
    userId: member.userId?.toString() || null,
    email: member.email,
    role: member.role,
    status: member.status,
    permissions: member.permissions,
    invitedAt: member.invitedAt,
    joinedAt: member.joinedAt,
  };
}

async function ownedCircle(circleId, userId) {
  if (!mongoose.isValidObjectId(circleId)) return null;
  return Circle.findOne({ _id: circleId, primaryUserId: userId, status: 'active' });
}

router.post('/', asyncHandler(async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Circle name must contain 2–60 characters.' });
  const user = await User.findById(req.user.id).select('email');
  const circle = await Circle.create({
    name: parsed.data.name,
    primaryUserId: req.user.id,
    members: [{ userId: req.user.id, email: user.email, role: 'primary', status: 'active', joinedAt: new Date() }],
  });
  return res.status(201).json({
    circle: { id: circle._id.toString(), name: circle.name, status: circle.status, members: circle.members.map(memberView) },
  });
}));

router.get('/', asyncHandler(async (req, res) => {
  const circles = await Circle.find({
    status: 'active',
    $or: [{ primaryUserId: req.user.id }, { 'members.userId': req.user.id, 'members.status': 'active' }],
  }).sort({ createdAt: -1 }).lean();
  return res.json({ circles: circles.map(circle => ({
    id: circle._id.toString(), name: circle.name, status: circle.status,
    role: circle.primaryUserId.toString() === req.user.id ? 'primary' : 'secondary',
    members: circle.members.map(member => ({
      id: member._id.toString(), userId: member.userId?.toString() || null,
      email: member.email, role: member.role, status: member.status, permissions: member.permissions,
    })),
  })) });
}));

router.post('/:circleId/invitations', asyncHandler(async (req, res) => {
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Provide a valid email and permissions.' });
  const circle = await ownedCircle(req.params.circleId, req.user.id);
  if (!circle) return res.status(404).json({ message: 'Circle not found.' });
  if (parsed.data.email === req.user.email) return res.status(400).json({ message: 'You cannot invite yourself.' });
  const existing = circle.members.find(m => m.email === parsed.data.email && m.status !== 'revoked');
  if (existing) return res.status(409).json({ message: 'This email already has an active or pending Circle membership.' });
  const invitee = await User.findOne({ email: parsed.data.email }).select('_id');
  const member = circle.members.create({
    userId: invitee?._id || null,
    email: parsed.data.email,
    role: 'secondary',
    status: 'pending',
    permissions: parsed.data.permissions || {},
  });
  circle.members.push(member);
  await circle.save();
  return res.status(201).json({ invitation: memberView(member), message: 'Invitation created. The invited user must sign in with this email to accept.' });
}));

router.get('/invitations/pending', asyncHandler(async (req, res) => {
  const circles = await Circle.find({ status: 'active', members: { $elemMatch: { email: req.user.email, role: 'secondary', status: 'pending' } } }).select('name members');
  const invitations = circles.flatMap(circle => circle.members
    .filter(m => m.email === req.user.email && m.role === 'secondary' && m.status === 'pending')
    .map(m => ({ circleId: circle._id.toString(), circleName: circle.name, invitation: memberView(m) })));
  return res.json({ invitations });
}));

router.post('/:circleId/invitations/:memberId/accept', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.circleId) || !mongoose.isValidObjectId(req.params.memberId)) return res.status(404).json({ message: 'Invitation not found.' });
  const circle = await Circle.findOneAndUpdate({
    _id: req.params.circleId, status: 'active',
    members: { $elemMatch: { _id: req.params.memberId, email: req.user.email, role: 'secondary', status: 'pending' } },
  }, { $set: { 'members.$.userId': req.user.id, 'members.$.status': 'active', 'members.$.joinedAt': new Date() } }, { new: true });
  if (!circle) return res.status(404).json({ message: 'Invitation not found or it does not belong to your account.' });
  const member = circle.members.id(req.params.memberId);
  return res.json({ circleId: circle._id.toString(), member: memberView(member) });
}));

router.patch('/:circleId/members/:memberId/permissions', asyncHandler(async (req, res) => {
  const parsed = permissionsSchema.safeParse(req.body);
  if (!parsed.success || Object.keys(parsed.data || {}).length === 0) return res.status(400).json({ message: 'Provide at least one valid permission to update.' });
  const circle = await ownedCircle(req.params.circleId, req.user.id);
  if (!circle) return res.status(404).json({ message: 'Circle not found.' });
  const member = circle.members.id(req.params.memberId);
  if (!member || member.role !== 'secondary' || member.status === 'revoked') return res.status(404).json({ message: 'Secondary member not found.' });
  Object.assign(member.permissions, parsed.data);
  await circle.save();
  return res.json({ member: memberView(member) });
}));

router.delete('/:circleId/members/:memberId', asyncHandler(async (req, res) => {
  const circle = await ownedCircle(req.params.circleId, req.user.id);
  if (!circle) return res.status(404).json({ message: 'Circle not found.' });
  const member = circle.members.id(req.params.memberId);
  if (!member || member.role !== 'secondary') return res.status(404).json({ message: 'Secondary member not found.' });
  member.status = 'revoked';
  member.permissions.canShop = false;
  member.permissions.canPay = false;
  member.permissions.canReceive = false;
  member.permissions.autoApprove = false;
  await circle.save();
  return res.status(204).end();
}));

export default router;
