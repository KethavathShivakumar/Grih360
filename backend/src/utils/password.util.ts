import bcrypt from 'bcryptjs';

export class PasswordUtil {
  private static readonly SALT_ROUNDS = 10;

  /**
   * Hash a plain text password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, PasswordUtil.SALT_ROUNDS);
  }

  /**
   * Compare a plain text password with a stored password hash
   */
  static async comparePassword(plainText: string, passwordHash: string): Promise<boolean> {
    if (!plainText || !passwordHash) return false;
    return bcrypt.compare(plainText, passwordHash);
  }
}
