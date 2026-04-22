import mongoose from 'mongoose';

const themeConfigSchema = new mongoose.Schema({
  colors: {
    primary:    { type: String, default: '#3B82F6' },
    secondary:  { type: String, default: '#10B981' },
    accent:     { type: String, default: '#F59E0B' },
    background: { type: String, default: '#FFFFFF' },
    text:       { type: String, default: '#1F2937' },
  },
  fonts: {
    primary:   { type: String, default: 'Inter' },
    secondary: { type: String, default: 'Roboto' },
  },
  layout: {
    headerStyle: { type: String, enum: ['CLASSIC', 'MODERN', 'MINIMAL'], default: 'MODERN' },
    footerStyle: { type: String, enum: ['SIMPLE', 'DETAILED'],           default: 'DETAILED' },
  },
  logo: { main: String, favicon: String },
}, { timestamps: true });

themeConfigSchema.statics.getConfig = async function () {
  let cfg = await this.findOne();
  if (!cfg) cfg = await this.create({});
  return cfg;
};

export default mongoose.model('ThemeConfig', themeConfigSchema);
