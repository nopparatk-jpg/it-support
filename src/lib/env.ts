function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

export const env = {
  MONGODB_URI: required('MONGODB_URI'),
  JWT_SECRET: required('JWT_SECRET'),
  get RESEND_API_KEY() { return process.env.RESEND_API_KEY ?? ''; },
  get GOOGLE_SERVICE_ACCOUNT_KEY_BASE64() { return process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 ?? ''; },
  get GOOGLE_DRIVE_FOLDER_ID() { return process.env.GOOGLE_DRIVE_FOLDER_ID ?? ''; },
  get APP_URL() { return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'; },
};
