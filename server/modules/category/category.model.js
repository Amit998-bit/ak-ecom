import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Category name is required'],
      trim:     true,
    },
    slug: {
      // ✅ FIXED: unique:true already creates the index
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
    },
    description: { type: String, trim: true },
    parent: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Category',
      default: null,
    },
    image:    String,
    isActive: { type: Boolean, default: true },
    seo: {
      metaTitle:       String,
      metaDescription: String,
      metaKeywords:    [String],
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ✅ FIXED: Removed duplicate slug index
// slug already indexed by unique:true above
categorySchema.index({ parent:   1 });
categorySchema.index({ isActive: 1 });

// Virtual for children
categorySchema.virtual('children', {
  ref:         'Category',
  localField:  '_id',
  foreignField: 'parent',
});

// Get breadcrumb path
categorySchema.methods.getPath = async function () {
  const pathArr = [this];
  let current   = this;

  while (current.parent) {
    current = await this.model('Category').findById(current.parent);
    if (current) pathArr.unshift(current);
  }

  return pathArr;
};

categorySchema.set('toJSON',   { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

export default mongoose.model('Category', categorySchema);