import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Product',
      required: true,
    },
    customer: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Order',
    },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    title:   { type: String, trim: true },
    comment: { type: String, required: true, trim: true },
    images:  [String],
    isVerifiedPurchase: { type: Boolean, default: false },
    isApproved:         { type: Boolean, default: false },
    adminReply: {
      comment:   String,
      repliedAt: Date,
    },
    helpfulCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ✅ FIXED: Clean indexes - no duplicates
reviewSchema.index({ product:    1 });
reviewSchema.index({ customer:   1 });
reviewSchema.index({ isApproved: 1 });
// Compound unique index: one review per user per product
reviewSchema.index({ product: 1, customer: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);