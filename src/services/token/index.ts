import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";

const access = process.env.JSON_WEB_ACCESS_TOKEN_SECRET as string;
const refresh = process.env.JSON_WEB_REFRESH_SECRET as string;

export interface TokenPayload {
  id: number;
  email: string;
  roles: string[];
}

class AuthorizationTokenService {
  public static generateTokens(user: TokenPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, roles: user.roles },
      access,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      }
    );
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email, roles: user.roles },
      refresh,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      }
    );
    return {
      accessToken,
      refreshToken,
    };
  }

  // Verify the provided JWT and return decoded data
  public static verifyToken(
    token: string,
    type: "access" | "refresh"
  ): TokenPayload | null {
    try {
      const secret = type === "access" ? access : refresh;

      return jwt.verify(token, secret) as TokenPayload;
    } catch (error) {
      console.error(error, "error");
      throw new Error("Invalid token");
    }
  }

  // Refresh the token by generating a new pair of tokens
  public static refreshToken(token: string): {
    accessToken: string;
    refreshToken: string;
  } {
    try {
      const decoded = jwt.verify(token, refresh) as TokenPayload;
      return this.generateTokens(decoded);
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  public static generateResetToken() {
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000);
    return { resetToken, resetTokenExpiry };
  }
}

export default AuthorizationTokenService;
