import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import http from 'http';
import crypto from 'crypto';
import assert from 'assert';
import app from '../app';
import { connectDatabase } from '../config/database';
import { UserModel } from '../models/user.model';
import { PasswordUtil } from '../utils/password.util';
import { AuthService } from '../services/auth.service';

function makeRequest(
  port: number,
  pathName: string,
  method: string,
  token?: string
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: pathName,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 0, body: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode || 0, body: raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('=== RUNNING ADMIN ROLE ACCESS VERIFICATION TEST ===');
  await connectDatabase();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as any).port;
  console.log(`Test server running on port ${port}`);

  const randomSuffix = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const adminEmail = `throwaway-admin-${randomSuffix}@grih360.test`;
  const tenantEmail = `throwaway-tenant-${randomSuffix}@grih360.test`;
  const randomPassword = 'Tst' + crypto.randomBytes(8).toString('hex') + '!9a';
  const passwordHash = await PasswordUtil.hashPassword(randomPassword);

  let adminUserId: any = null;
  let tenantUserId: any = null;

  try {
    // 1. Create throwaway admin user
    const adminUser = await UserModel.create({
      name: 'Throwaway Admin',
      email: adminEmail,
      phone: '90000' + Math.floor(10000 + Math.random() * 90000),
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
    });
    adminUserId = adminUser._id;
    console.log(`[Test] Created throwaway ADMIN: ${adminEmail}`);

    // 2. Create throwaway tenant user
    const tenantUser = await UserModel.create({
      name: 'Throwaway Tenant',
      email: tenantEmail,
      phone: '91000' + Math.floor(10000 + Math.random() * 90000),
      passwordHash,
      role: 'TENANT',
      isActive: true,
      isEmailVerified: true,
    });
    tenantUserId = tenantUser._id;
    console.log(`[Test] Created throwaway TENANT: ${tenantEmail}`);

    // 3. Authenticate throwaway admin
    const adminAuth = await AuthService.loginUser({
      identifier: adminEmail,
      password: randomPassword,
      directToken: true,
    });
    const adminToken = (adminAuth as any).tokens?.accessToken;
    assert(adminToken, 'Admin token must be generated');
    console.log('[Test] Successfully authenticated throwaway admin and obtained JWT');

    // 4. Authenticate throwaway tenant
    const tenantAuth = await AuthService.loginUser({
      identifier: tenantEmail,
      password: randomPassword,
      directToken: true,
    });
    const tenantToken = (tenantAuth as any).tokens?.accessToken;
    assert(tenantToken, 'Tenant token must be generated');
    console.log('[Test] Successfully authenticated throwaway tenant and obtained JWT');

    // 5. Test Admin Token on Admin API (/api/v1/admin/stats)
    const adminAccess = await makeRequest(port, '/api/v1/admin/stats', 'GET', adminToken);
    console.log(`[Test] Admin accessing /api/v1/admin/stats -> HTTP ${adminAccess.status}`);
    assert.strictEqual(adminAccess.status, 200, 'Admin token must return HTTP 200 on /api/v1/admin/stats');
    assert.strictEqual(adminAccess.body?.success, true, 'Admin response must indicate success');

    // 6. Test Tenant Token on Admin API (/api/v1/admin/stats)
    const tenantAccess = await makeRequest(port, '/api/v1/admin/stats', 'GET', tenantToken);
    console.log(`[Test] Tenant accessing /api/v1/admin/stats -> HTTP ${tenantAccess.status}`);
    assert.strictEqual(tenantAccess.status, 403, 'Tenant token must return HTTP 403 on /api/v1/admin/stats');
    assert.strictEqual(tenantAccess.body?.error?.code, 'FORBIDDEN', 'Error code must be FORBIDDEN');

    console.log('✔ All role authorization assertions PASSED.');
  } finally {
    // 7. Clean up throwaway users
    if (adminUserId) {
      await UserModel.deleteOne({ _id: adminUserId });
      console.log('[Test] Cleaned up throwaway ADMIN');
    }
    if (tenantUserId) {
      await UserModel.deleteOne({ _id: tenantUserId });
      console.log('[Test] Cleaned up throwaway TENANT');
    }

    server.close();
    await mongoose.connection.close();
  }

  console.log('=== TEST COMPLETED SUCCESSFULLY ===');
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
