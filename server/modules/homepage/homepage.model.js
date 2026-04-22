import mongoose from 'mongoose';

const homepageConfigSchema = new mongoose.Schema({
  sections: [{
    type: {
      type: String,
      enum: ['BANNER','FEATURED_PRODUCTS','LATEST_PRODUCTS','TESTIMONIALS','GALLERY','VIDEO','CATEGORIES'],
      required: true,
    },
    enabled: { type: Boolean, default: true },
    order:   { type: Number,  required: true },
    config:  mongoose.Schema.Types.Mixed,
  }],
}, { timestamps: true });

homepageConfigSchema.statics.getConfig = async function () {
  let cfg = await this.findOne();
  if (!cfg) cfg = await this.create({ sections: [] });
  return cfg;
};

export default mongoose.model('HomepageConfig', homepageConfigSchema);
