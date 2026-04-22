import 'dotenv/config';
import app       from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

connectDB();

const server = app.listen(PORT, () => {
  console.log('');
  console.log('  🚀 Server running!');
  console.log('  📡 Port : ' + PORT);
  console.log('  🌍 URL  : http://localhost:' + PORT);
  console.log('  🏥 Health: http://localhost:' + PORT + '/api/health');
  console.log('');
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});
