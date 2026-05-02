// TLS fix for local development when system clock is wrong
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Now start Next.js
const { spawn } = require('child_process');
const next = spawn('npx', ['next', 'dev'], { stdio: 'inherit', shell: true });

next.on('error', (err) => {
  console.error('Failed to start next dev:', err);
  process.exit(1);
});
