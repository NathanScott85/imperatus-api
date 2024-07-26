import jwt from 'jsonwebtoken';

const secret = process.env.JSON_WEB_TOKEN_SECRET || 'your_secret_key';

class AuthService {
  public static generateToken(user: { id: number; email: string; admin: boolean }) {
    return jwt.sign(user, secret, { expiresIn: '1h' });
  }

  public static verifyToken(token: string) {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  public static refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, secret);
      const { id, email, admin } = decoded as any;
      return this.generateToken({ id, email, admin });
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

export default AuthService