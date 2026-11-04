import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Circle } from '../models/Circle.js';
import { PurchaseApproval } from '../models/PurchaseApproval.js';
import { requireAuth } from '../middleware/require-auth.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
router.use(requireAuth);

const requestSchema = z.object({
  circleId: z.string().regex(/^[a-f\\d]{24}$/i),
  itemName: z.string().trim().min(1).max(120),
  amount: z.string().regex(/^\\d{1,7}\\.\\d{2}$/).refine(v => Number(v) > 0),
  currency: z.string().length(3).transform(v => v.toUpperCase()),
});
const decisionSchema = z.object({ decision: z.enum(['approve', 'reject']), note: z.string().trim().max(300).optional() });

function toCents(value) {
  const [whole, fraction] = value.split('.');
  return Number(whole) * 100 + Number(fraction);
}
function approvalView(item) {
  return {
    id: item._id.toString(), circleId: item.circleId.toString(),
    memberId: item.memberId.toString(), secondaryUserId: item.secondaryUserId.toString(),
    itemName: item.itemName, amount: item.amount, currency: item.currency,
    status: item.status, decisionNote: item.decisionNote, createdAt: item.createdAt,
    decidedAt: item.decidedAt,
  };
}

// A request reserves its amount against the member's daily limit, even while pending.
router.post('/', asyncHandler(async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Provide a valid Circle, item, amount and currency.' });
  const { circleId, itemName, amount, currency } = parsed.data;
  const session = await mongoose.startSession();
  let response;
  try {
    await session.withTransaction(async () => {
      const circle = await Circle.findOne({
        _id: circleId, status: 'active',
        members: { $elemMatch: { userId: req.user.id, role: 'secondary', status: 'active' } },
      }).session(session);
      if (!circle) {
        response = { status: 404, body: { message: 'Active Circle membership not found.' } };
        return;
      }
      const member = circle.members.find(m => m.userId?.toString() === req.user.id && m.role === 'secondary' && m.status === 'active');
      const p = member.permissions;
      if (!p.canShop || !p.canPay) {
        response = { status: 403, body: { message: 'Your Circle permissions do not allow shopping and paying.' } };
        return;
      }
      if (p.currency !== currency) {
        response = { status: 400, body: { message: 'Requested currency does not match your Circle spending policy.', allowedCurrency: p.currency } };
        return;
      }
      const requestedCents = toCents(amount);
      if (p.perTransactionLimit <= 0 || requestedCents > toCents(Number(p.perTransactionLimit).toFixed(2))) {
        response = { status: 403, body: { message: 'This purchase exceeds your per-transaction limit.' } };
        return;
      }
      const dayStart = new Date();
      dayStart.setUTCHours(0, 0, 0, 0);
      const used = await PurchaseApproval.aggregate([
        { $match: { circleId: circle._id, memberId: member._id, createdAt: { $gte: dayStart }, status: { $in: ['pending', 'approved'] } } },
        { $group: { _id: null, total: { $sum: { $toDecimal: '$amount' } } } },
      ]).session(session);
      const usedCents = used.length ? Math.round(Number(used[0].total.toString()) * 100) : 0;
      if (p.dailyLimit <= 0 || usedCents + requestedCents > toCents(Number(p.dailyLimit).toFixed(2))) {
        response = { status: 403, body: { message: 'This purchase exceeds your remaining daily spending limit.' } };
        return;
      }
      const status = p.autoApprove ? 'approved' : 'pending';
      const [created] = await PurchaseApproval.create([{
        circleId: circle._id, memberId: member._id, secondaryUserId: req.user.id,
        primaryUserId: circle.primaryUserId, itemName, amount, currency, status,
        ...(status === 'approved' ? { decidedAt: new Date(), decisionNote: 'Automatically approved within Circle policy.' } : {}),
      }], { session });
      response = { status: 201, body: { approval: approvalView(created), message: status === 'approved' ? 'Purchase request automatically approved by Circle policy.' : 'Purchase request sent to the Circle primary user for approval.' } };
    });
  } finally {
    await session.endSession();
  }
  return res.status(response.status).json(response.body);
}));

router.get('/pending', asyncHandler(async (req, res) => {
  const approvals = await PurchaseApproval.find({ primaryUserId: req.user.id, status: 'pending' }).sort({ createdAt: 1 }).lean();
  return res.json({ approvals: approvals.map(approvalView) });
}));

router.post('/:approvalId/decision', asyncHandler(async (req, res) => {
  const parsed = decisionSchema.safeParse(req.body);
  if (!parsed.success || !mongoose.isValidObjectId(req.params.approvalId)) {
    return res.status(400).json({ message: 'Provide a valid approval ID and decision.' });
  }
  const approval = await PurchaseApproval.findOneAndUpdate({
    _id: req.params.approvalId, primaryUserId: req.user.id, status: 'pending',
  }, {
    $set: {
      status: parsed.data.decision === 'approve' ? 'approved' : 'rejected',
      decisionNote: parsed.data.note || null,
      decidedAt: new Date(),
    },
  }, { new: true });
  if (!approval) return res.status(404).json({ message: 'Pending approval not found for your account.' });
  return res.json({ approval: approvalView(approval) });
}));

router.get('/mine', asyncHandler(async (req, res) => {
  const approvals = await PurchaseApproval.find({ secondaryUserId: req.user.id }).sort({ createdAt: -1 }).limit(50).lean();
  return res.json({ approvals: approvals.map(approvalView) });
}));

export default router;
