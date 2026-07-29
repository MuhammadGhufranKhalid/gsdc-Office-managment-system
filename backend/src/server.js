import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

const start = async () => {
  try {
    await connectDB(env.mongoUri);
    app.listen(env.port, () =>
      console.log(`\u2713 GSDC OMS API listening on http://localhost:${env.port} [${env.nodeEnv}]`)
    );
  } catch (err) {
    console.error('\u2717 Failed to start server:', err.message);
    process.exit(1);
  }
};

start();
