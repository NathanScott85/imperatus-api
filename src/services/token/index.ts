import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";

const access = process.env.JSON_WEB_ACCESS_TOKEN_SECRET as string;
const refresh = process.env.JSON_WEB_REFRESH_SECRET as string;
const refreshExpiry = process.env.REFRESH_TOKEN_EXPIRY as string; // wont let me login with these
const accessExpiry = process.env.ACCESS_TOKEN_EXPIRY as string; // wont let me login with these
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

export interface TokenPayload {
  id: number;
  email: string;
  roles: string[];
}

class AuthorizationTokenService {
  // Generate a JWT for user authentication, need to sort out typing later.
  public static generateTokens(user: TokenPayload): any {
    const accessToken = jwt.sign({ id: user.id, email: user.email }, access, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
    const refreshToken = jwt.sign({ id: user.id, email: user.email }, refresh, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });
    return {
      accessToken,
      refreshToken,
    };
  }

  // Verify the provided JWT and return decoded data
  public static verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, access) as TokenPayload;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  public static refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, access);
      const { id, email, roles } = decoded as any;
      return this.generateTokens({ id, email, roles });
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  // Generate a reset token for password recovery
  public static generateResetToken() {
    const resetToken = randomBytes(32).toString("hex"); // Secure token generation
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry
    return { resetToken, resetTokenExpiry };
  }
}

export default AuthorizationTokenService;
