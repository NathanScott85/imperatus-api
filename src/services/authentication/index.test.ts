import AuthenticationService from "../authentication";
import { prisma } from "../../server";
import SecurityService from "../security";
import AutherisationTokenService from "../token";
import EmailService from "../email";

jest.mock("../security");
jest.mock("../token");
jest.mock("../email");
jest.mock("../../server", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

describe("AuthenticationService", () => {
  const mockUser = {
    id: 1,
    email: "test@example.com",
    password: "$2b$10$hashedpassword",
    roles: [{ role: { name: "USER" } }],
  };

  describe("loginUser", () => {
    it("should login user successfully with correct email and password", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (SecurityService.comparePassword as jest.Mock).mockResolvedValue(true);
      (AutherisationTokenService.generateToken as jest.Mock).mockReturnValue(
        "testtoken"
      );

      const result = await AuthenticationService.loginUser(
        "test@example.com",
        "password123"
      );

      expect(result).toEqual({
        token: "testtoken",
        user: mockUser,
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        include: { roles: { include: { role: true } } },
      });
      expect(SecurityService.comparePassword).toHaveBeenCalledWith(
        "password123",
        mockUser.password
      );
      expect(AutherisationTokenService.generateToken).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        roles: ["USER"],
      });
    });

    it("should throw an error if the user is not found", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        AuthenticationService.loginUser("test@example.com", "password123")
      ).rejects.toThrow("User not found");
    });

    it("should throw an error if the password does not match", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (SecurityService.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(
        AuthenticationService.loginUser("test@example.com", "password123")
      ).rejects.toThrow("Invalid password");
    });
  });

  describe("requestPasswordReset", () => {
    it("should request password reset successfully", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (
        AutherisationTokenService.generateResetToken as jest.Mock
      ).mockReturnValue({
        resetToken: "resettoken",
        resetTokenExpiry: new Date(Date.now() + 3600000),
      });

      const result = await AuthenticationService.requestPasswordReset(
        "test@example.com"
      );

      expect(result).toEqual({ message: "Password reset token sent to email" });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        data: { resetToken: "resettoken", resetTokenExpiry: expect.any(Date) },
      });
      expect(EmailService.sendMail).toHaveBeenCalledWith({
        from: "no-reply@example.com",
        to: "test@example.com",
        subject: "Password Reset",
        text: expect.stringContaining("resettoken"),
        html: expect.stringContaining("resettoken"),
      });
    });

    it("should throw an error if the user is not found", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        AuthenticationService.requestPasswordReset("test@example.com")
      ).rejects.toThrow("User with this email does not exist");
    });
  });

  describe("resetPassword", () => {
    it("should reset password successfully with valid token", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (SecurityService.hashPassword as jest.Mock).mockResolvedValue(
        "newhashedpassword"
      );

      const result = await AuthenticationService.resetPassword(
        "validtoken",
        "newpassword123"
      );

      expect(result).toEqual({ message: "Password successfully reset" });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          password: "newhashedpassword",
          resetToken: null,
          resetTokenExpiry: null,
        },
      });
    });

    it("should throw an error if the token is invalid or expired", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        AuthenticationService.resetPassword("invalidtoken", "newpassword123")
      ).rejects.toThrow("Invalid or expired reset token");
    });
  });
});
