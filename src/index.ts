import { createApiServer } from './api';
import { LeaderboardMonitor } from './monitor';

const PORT = process.env.PORT || 3000;
const UPDATE_INTERVAL_MINUTES = parseInt(process.env.UPDATE_INTERVAL || '5');
const DB_PATH = process.env.DB_PATH;

const app = createApiServer(DB_PATH);
const server = app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

const monitor = new LeaderboardMonitor(DB_PATH);
monitor.start(UPDATE_INTERVAL_MINUTES);

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  monitor.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  monitor.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
