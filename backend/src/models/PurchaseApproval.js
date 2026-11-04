import mongoose from 'mongoose';

const purchaseApprovalSchema = new mongoose.Schema({
  circleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Circle', required: true, index: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, required: true },
  secondaryUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  primaryUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  itemName: { type: String, required: true, trim: true, maxlength: 120 },
  amount: { type: String, required: true, match: /^\\d{1,7}\\.\\d{2}$/ },
  currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending', index: true },
  decisionNote: { type: String, trim: true, maxlength: 300, default: null },
  decidedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false });

purchaseApprovalSchema.index({ primaryUserId: 1, status: 1, createdAt: -1 });
purchaseApprovalSchema.index({ circleId: 1, memberId: 1, createdAt: -1 });

export const PurchaseApproval = mongoose.models.PurchaseApproval || mongoose.model('PurchaseApproval', purchaseApprovalSchema);
