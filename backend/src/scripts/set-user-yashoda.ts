import { connectDatabase } from '../config/database';
import { UserModel, TenantProfileModel } from '../models';
import { PasswordUtil } from '../utils/password.util';
import mongoose from 'mongoose';

async function main() {
  await connectDatabase();
  const email = 'kethavathyashoda96@gmail.com';
  const name = 'Yashoda';
  const phone = '7995228429';
  const password = 'Yash@123';
  const passwordHash = await PasswordUtil.hashPassword(password);

  let user = await UserModel.findOne({ email });

  if (user) {
    user.name = name;
    user.phone = phone;
    user.passwordHash = passwordHash;
    user.role = 'TENANT';
    user.isActive = true;
    await user.save();
    console.log('✅ User updated successfully in MongoDB:', {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
  } else {
    user = await UserModel.create({
      name,
      email,
      phone,
      passwordHash,
      role: 'TENANT',
      isActive: true,
      identityVerificationStatus: 'NOT_STARTED',
    });
    await TenantProfileModel.create({ userId: user._id });
    console.log('✅ User created successfully in MongoDB:', {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
  }

  // Also verify tenant profile exists
  const profile = await TenantProfileModel.findOne({ userId: user._id });
  if (!profile) {
    await TenantProfileModel.create({ userId: user._id });
    console.log('✅ TenantProfile created for user');
  } else {
    console.log('✅ TenantProfile verified for user');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Error updating user:', err);
  process.exit(1);
});
