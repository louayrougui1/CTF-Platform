import { registerAs } from '@nestjs/config';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export default registerAs('googleOAuth', () => ({
  clientId: requireEnv('GOOGLE_CLIENT_ID'),
  clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
  callbackURL: requireEnv('GOOGLE_CALLBACK_URL'),
}));
