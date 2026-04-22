import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      // ✅ FIXED: unique:true creates the index automatically
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'Product',
      },
    ],
  },
  { timestamps: true }
);

// ✅ FIXED: Removed duplicate user index
// No extra index needed - already created by unique:true

export default mongoose.model('Wishlist', wishlistSchema);