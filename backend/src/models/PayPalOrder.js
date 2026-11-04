import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  approvalId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseApproval', required: true, unique: true },
  paypalOrderId: { type: String, required: true, unique: true, maxlength: 80 },
  itemName: { type: String, required: true, trim: true, maxlength: 120 },
  amount: { type: String, required: true, match: /^\\d{1,7}\\.\\d{2}$/ },
  currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
  status: { type: String, required: true, default: 'CREATED', maxlength: 24 },
  captureId: { type: String, default: null },
  approvalUrl: { type: String, required: true, maxlength: 2048 },
}, { timestamps: true, versionKey: false });

schema.index({ userId: 1, createdAt: -1 });

export const PayPalOrder = mongoose.models.PayPalOrder || mongoose.model('PayPalOrder', schema);
