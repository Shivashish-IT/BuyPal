import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
  role: { type: String, enum: ['primary', 'secondary'], required: true },
  status: { type: String, enum: ['pending', 'active', 'revoked'], default: 'pending' },
  permissions: {
    canShop: { type: Boolean, default: true },
    canPay: { type: Boolean, default: true },
    canReceive: { type: Boolean, default: true },
    autoApprove: { type: Boolean, default: false },
    perTransactionLimit: { type: Number, min: 0, default: 0 },
    dailyLimit: { type: Number, min: 0, default: 0 },
    currency: { type: String, uppercase: true, default: 'USD', minlength: 3, maxlength: 3 },
  },
  invitedAt: { type: Date, default: Date.now },
  joinedAt: { type: Date, default: null },
}, { _id: true });

const circleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
  primaryUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  members: { type: [memberSchema], default: [] },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
}, { timestamps: true, versionKey: false });

circleSchema.index({ 'members.email': 1, status: 1 });

export const Circle = mongoose.models.Circle || mongoose.model('Circle', circleSchema);
