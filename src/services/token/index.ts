import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const secret = process.env.JSON_WEB_TOKEN_SECRET || "your_secret_key";

class AutherisationTokenService {
  public static generateToken(user: {
    id: number;
    email: string;
    roles: string[];
  }) {
    return jwt.sign(user, secret, { expiresIn: "1h" });
  }

  public static verifyToken(token: string) {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  public static refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, secret);
      const { id, email, roles } = decoded as any;
      return this.generateToken({ id, email, roles });
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  public static generateResetToken() {
    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    return { resetToken, resetTokenExpiry };
  }
}

export default AutherisationTokenService;
