import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    isActive: { type: Boolean, default: true },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

CouponSchema.index({ code: 1 });

export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
