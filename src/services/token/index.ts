import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const secret = process.env.JSON_WEB_TOKEN_SECRET || "your_secret_key";

export interface TokenPayload {
  id: number;
  email: string;
  roles: string[];
}

class AuthorizationTokenService {
  // Generate a JWT for user authentication
  public static generateToken(user: TokenPayload): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        roles: user.roles,
      },
      secret,
      { expiresIn: "1d" } // Token expiry set to 1 day
    );
  }

  // Verify the provided JWT and return decoded data
  public static verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, secret) as TokenPayload;
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

  // Generate a reset token for password recovery
  public static generateResetToken() {
    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry
    return { resetToken, resetTokenExpiry };
  }
}

export default AuthorizationTokenService;
