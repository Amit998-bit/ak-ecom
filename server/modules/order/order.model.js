import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Product',
    required: true,
  },
  title:    String,
  variant:  { sku: String, attributes: Map },
  quantity: { type: Number, required: true, min: 1 },
  price:    { type: Number, required: true },
  total:    Number,
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      // ✅ FIXED: unique:true creates the index automatically
      type:     String,
      unique:   true,
      required: true,
    },
    customer: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    items:       [orderItemSchema],
    subtotal:    { type: Number, required: true },
    discount:    { type: Number, default: 0 },
    shippingCost:{ type: Number, default: 0 },
    tax:         { type: Number, default: 0 },
    total:       { type: Number, required: true },
    shippingAddress: {
      fullName:     String,
      phone:        String,
      addressLine1: String,
      addressLine2: String,
      city:         String,
      state:        String,
      postalCode:   String,
      country:      String,
    },
    paymentMethod: {
      type:    String,
      enum:    ['COD', 'RAZORPAY', 'STRIPE'],
      default: 'COD',
    },
    paymentStatus: {
      type:    String,
      enum:    ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    paymentDetails: {
      transactionId: String,
      paidAt:        Date,
    },
    status: {
      type:    String,
      enum:    ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
    },
    trackingNumber: String,
    carrier:        String,
    appliedCoupon:  { code: String, discount: Number },
    customerNote:   String,
    adminNote:      String,
    confirmedAt:    Date,
    shippedAt:      Date,
    deliveredAt:    Date,
    cancelledAt:    Date,
  },
  { timestamps: true }
);

// ✅ FIXED: Removed duplicate orderNumber index
// orderNumber index is already created by unique:true above
orderSchema.index({ customer:      1 });
orderSchema.index({ status:        1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt:    -1 });

// Auto generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const ts  = Date.now().toString().slice(-8);
    const rnd = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = `ORD-${ts}-${rnd}`;
  }
  next();
});

export default mongoose.model('Order', orderSchema);