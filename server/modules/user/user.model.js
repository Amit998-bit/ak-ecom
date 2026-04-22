import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  fullName:     { type: String, required: true },
  phone:        { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: String,
  city:         { type: String, required: true },
  state:        { type: String, required: true },
  postalCode:   { type: String, required: true },
  country:      { type: String, default: 'India' },
  isDefault:    { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type:     String,
      required: [true, 'First name is required'],
      trim:     true,
    },
    lastName: {
      type:     String,
      required: [true, 'Last name is required'],
      trim:     true,
    },
    email: {
      // ✅ FIXED: Removed duplicate index: true
      // unique: true already creates an index automatically
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: 8,
      select:    false,
    },
    phone:     { type: String, trim: true },
    avatar:    String,
    role: {
      type:    String,
      enum:    ['CUSTOMER', 'STAFF', 'ADMIN'],
      default: 'CUSTOMER',
    },
    addresses:    [addressSchema],
    refreshToken: { type: String, select: false },
    isActive:     { type: Boolean, default: true },
    lastLogin:    Date,
  },
  { timestamps: true }
);

// ✅ FIXED: Only ONE index definition per field
// email index is already created by unique:true above
// Only add indexes for fields that don't have unique:true
userSchema.index({ role: 1 });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set('toJSON',   { virtuals: true });
userSchema.set('toObject', { virtuals: true });

export default mongoose.model('User', userSchema);