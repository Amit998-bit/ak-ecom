import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  sku: {
    // ✅ FIXED: unique:true already creates index - no schema.index() needed
    type:     String,
    required: true,
    unique:   true,
  },
  attributes:   { type: Map, of: String },
  price:        { type: Number, required: true },
  comparePrice: Number,
  stock:        { type: Number, required: true, default: 0 },
  image:        String,
  isActive:     { type: Boolean, default: true },
});

const productSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: [true, 'Product title is required'],
      trim:     true,
    },
    slug: {
      // ✅ FIXED: unique:true already creates index
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
    },
    shortDescription: { type: String, maxlength: 500 },
    longDescription:  String,
    basePrice: {
      type:     Number,
      required: [true, 'Price is required'],
    },
    comparePrice: Number,
    sku: {
      type:   String,
      unique: true,
      sparse: true,
    },
    stock:    { type: Number, default: 0 },
    category: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Category',
      required: [true, 'Category is required'],
    },
    images: [
      {
        url:   { type: String, required: true },
        alt:   String,
        order: Number,
      },
    ],
    video:      { url: String, thumbnail: String },
    hasVariants:{ type: Boolean, default: false },
    options:    [{ name: String, values: [String] }],
    variants:   [variantSchema],
    seo: {
      metaTitle:       String,
      metaDescription: String,
      metaKeywords:    [String],
    },
    isFeatured:  { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    viewCount:   { type: Number, default: 0 },
    salesCount:  { type: Number, default: 0 },
    publishedAt: Date,
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ✅ FIXED: Removed duplicate slug index (slug:1)
// slug index is already created by unique:true above
// Only define indexes that are NOT already created by unique:true
productSchema.index({ category: 1 });
productSchema.index({ isPublished: 1, isFeatured: 1 });
productSchema.index({ title: 'text', shortDescription: 'text' });
productSchema.index({ basePrice: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for reviews
productSchema.virtual('reviews', {
  ref:         'Review',
  localField:  '_id',
  foreignField: 'product',
});

// Method to check stock
productSchema.methods.isInStock = function (qty = 1) {
  if (this.hasVariants) {
    return this.variants.some((v) => v.stock >= qty && v.isActive);
  }
  return this.stock >= qty;
};

export default mongoose.model('Product', productSchema);