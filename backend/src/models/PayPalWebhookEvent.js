import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true, maxlength: 100 },
  eventType: { type: String, required: true, maxlength: 120 },
  status: { type: String, enum: ['RECEIVED', 'PROCESSED', 'FAILED'], default: 'RECEIVED' },
  processedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false });

export const PayPalWebhookEvent = mongoose.models.PayPalWebhookEvent || mongoose.model('PayPalWebhookEvent', schema);
