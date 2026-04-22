import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      // ✅ FIXED: unique:true creates the index automatically
      type:     String,
      required: true,
      unique:   true,
      uppercase: true,
      trim:     true,
    },
    description:   String,
    discountType: {
      type:     String,
      enum:     ['PERCENTAGE', 'FIXED'],
      required: true,
    },
    discountValue: { type: Number, required: true },
    minPurchase:   { type: Number, default: 0 },
    maxDiscount:   Number,
    usageLimit:    { type: Number, default: null },
    usageCount:    { type: Number, default: 0 },
    perUserLimit:  { type: Number, default: 1 },
    startDate:     { type: Date, required: true },
    endDate:       { type: Date, required: true },
    isActive:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ✅ FIXED: Removed duplicate code index
// code index is already created by unique:true above
couponSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

// Validate coupon
couponSchema.methods.isValid = function () {
  const now = new Date();
  if (!this.isActive)
    return { valid: false, message: 'Coupon is inactive' };
  if (now < this.startDate)
    return { valid: false, message: 'Coupon not yet active' };
  if (now > this.endDate)
    return { valid: false, message: 'Coupon has expired' };
  if (this.usageLimit && this.usageCount >= this.usageLimit)
    return { valid: false, message: 'Coupon usage limit reached' };
  return { valid: true };
};

// Calculate discount
couponSchema.methods.calculateDiscount = function (subtotal) {
  if (this.discountType === 'PERCENTAGE') {
    const discount = (subtotal * this.discountValue) / 100;
    return this.maxDiscount ? Math.min(discount, this.maxDiscount) : discount;
  }
  return Math.min(this.discountValue, subtotal);
};

export default mongoose.model('Coupon', couponSchema);