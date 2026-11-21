import { createApp } from './app';
import { loadAuthConfig } from './auth';
import { databasePath, loadEnvFile, trustProxy, webDistPath } from './config';
import { openDatabase } from './db';

loadEnvFile();

const PORT = Number(process.env.PORT) || 3000;
const auth = loadAuthConfig();
const dbPath = databasePath();
const db = openDatabase(dbPath);

createApp({ db, auth, trustProxy: trustProxy(), webDist: webDistPath() }).listen(PORT, () => {
  console.log(`Torah Study API listening on port ${PORT}`);
  console.log(`Database: ${dbPath}`);
  if (!auth.passphrase) console.warn('APP_PASSPHRASE is not set: authentication is OFF (development only).');
});
