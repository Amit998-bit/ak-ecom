import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Product',
    required: true,
  },
  variant:  { type: mongoose.Schema.Types.ObjectId },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  price:    { type: Number, required: true },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      // ✅ FIXED: unique:true creates the index automatically
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,
    },
    items:         [cartItemSchema],
    appliedCoupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Coupon',
    },
    discount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ✅ FIXED: Removed duplicate user index
// No extra indexes needed - user:1 already created by unique:true

// Virtual for subtotal
cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
});

// Virtual for total
cartSchema.virtual('total').get(function () {
  return this.subtotal - this.discount;
});

cartSchema.set('toJSON',   { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

export default mongoose.model('Cart', cartSchema);