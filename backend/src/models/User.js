import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 254,
    index: true,
  },
  displayName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  passwordHash: { type: String, required: true, select: false },
  disabledAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
