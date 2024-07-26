import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'your_secret_key';

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
}

export default AuthService;
