import jwt from "jsonwebtoken";
import AutherisationTokenService from ".";

describe("AutherisationTokenService", () => {
  const user = {
    id: 1,
    email: "test@example.com",
    roles: ["USER"],
  };

  let token: string;

  beforeAll(() => {
    // Set a secret key for testing
    process.env.JSON_WEB_TOKEN_SECRET = "test_secret_key";
  });

  afterAll(() => {
    // Cleanup the environment variable after tests
    delete process.env.JSON_WEB_TOKEN_SECRET;
  });

  it("should generate a token", () => {
    token = AutherisationTokenService.generateToken(user);
    expect(token).toBeDefined();
  });

  it("should verify a valid token", () => {
    const decoded = AutherisationTokenService.verifyToken(token);
    expect(decoded).toHaveProperty("id", user.id);
    expect(decoded).toHaveProperty("email", user.email);
    expect(decoded).toHaveProperty("roles", user.roles);
  });

  it("should throw an error for an invalid token", () => {
    expect(() =>
      AutherisationTokenService.verifyToken("invalid_token")
    ).toThrow("Invalid token");
  });

  it("should refresh a token", () => {
    const newToken = AutherisationTokenService.refreshToken(token);
    expect(newToken).toBeDefined();
    const decodedNewToken = AutherisationTokenService.verifyToken(newToken);
    expect(decodedNewToken).toHaveProperty("id", user.id);
    expect(decodedNewToken).toHaveProperty("email", user.email);
    expect(decodedNewToken).toHaveProperty("roles", user.roles);
  });

  it("should throw an error for an invalid token during refresh", () => {
    expect(() =>
      AutherisationTokenService.refreshToken("invalid_token")
    ).toThrow("Invalid token");
  });

  it("should generate a reset token", () => {
    const { resetToken, resetTokenExpiry } =
      AutherisationTokenService.generateResetToken();
    expect(resetToken).toBeDefined();
    expect(resetTokenExpiry).toBeInstanceOf(Date);
  });
});
