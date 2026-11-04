import mongoose from 'mongoose';

const paypalOrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  paypalOrderId: { type: String, required: true, unique: true, maxlength: 80 },
  itemName: { type: String, required: true, trim: true, maxlength: 120 },
  // Keep monetary values as decimal strings to avoid floating-point rounding.
  amount: { type: String, required: true, match: /^\d{1,7}\.\d{2}$/ },
  currency: { type: String, required: true, minlength: 3, maxlength: 3 },
  status: { type: String, required: true, default: 'CREATED', maxlength: 24 },
  captureId: { type: String, default: null },
}, { timestamps: true, versionKey: false });

paypalOrderSchema.index({ userId: 1, createdAt: -1 });

export const PayPalOrder = mongoose.models.PayPalOrder || mongoose.model('PayPalOrder', paypalOrderSchema);
