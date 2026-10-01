import { connectDatabase } from '../config/database';
import { UserModel } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { EmailService } from '../services/email.service';
import { config } from '../config/env';
import mongoose from 'mongoose';

async function main() {
  console.log('=== Checking MongoDB Connection ===');
  await connectDatabase();
  console.log('MongoDB connection state:', mongoose.connection.readyState);

  const targetEmail = 'kethavathyashoda96@gmail.com';
  const targetPhone = '7995228429';

  console.log('\n=== Checking if User Exists ===');
  const existingByEmail = await UserModel.findOne({ email: targetEmail });
  const existingByPhone = await UserModel.findOne({ phone: targetPhone });

  console.log('Existing by Email:', existingByEmail ? { id: existingByEmail._id, name: existingByEmail.name, email: existingByEmail.email } : null);
  console.log('Existing by Phone:', existingByPhone ? { id: existingByPhone._id, name: existingByPhone.name, phone: existingByPhone.phone } : null);

  console.log('\n=== Checking SMTP Configuration in config ===');
  console.log('SMTP Host:', config.smtpHost);
  console.log('SMTP Port:', config.smtpPort);
  console.log('SMTP User:', config.smtpUser);
  console.log('SMTP Pass configured?:', Boolean(config.smtpPass && config.smtpPass.length > 0));
  console.log('Email From:', config.emailFrom);

  console.log('\n=== Testing SMTP Connection ===');
  const verifyRes = await EmailService.verifyConnection();
  console.log('Verify Result:', verifyRes);

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
