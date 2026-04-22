// Simple toast utility (no extra library needed)
const toast = {
  success: (msg: string) => console.log('✅ ' + msg),
  error:   (msg: string) => console.error('❌ ' + msg),
  info:    (msg: string) => console.info('ℹ️ '  + msg),
};

export default toast;
