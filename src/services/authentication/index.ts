import { AuthenticationError, UserInputError } from "apollo-server";
import jwt, { GetPublicKeyOrSecret, Secret } from "jsonwebtoken";
import { prisma } from "../../server";
import SecurityService from "../security";
import UserService from "../users";
import AuthorizationTokenService from "../token";
import EmailService from "../email";
import { createHash } from "crypto";
import moment from "moment";

interface JwtPayload {
  id: number;
  email: string;
  roles: string[];
}

class AuthenticationService {
  public async loginUser(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        email: true,
        emailVerified: true,
        fullname: true,
        address: true,
        postcode: true,
        city: true,
        dob: true,
        phone: true,
        userRoles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        id: true,
        password: true,
      },
    });
  
    if (!user) {
      throw new Error("Invalid email or password");
    }
  
    const isPasswordValid = await SecurityService.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }
  
    const roles = user.userRoles.map((roleObject) => roleObject.role.name);
    const { accessToken, refreshToken } = AuthorizationTokenService.generateTokens({
      id: user.id,
      email: user.email,
      roles,
    });
  
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: refreshToken,
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  
    const { password: _, ...userWithoutPassword } = user;
  
    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    };
  }
  
  public async logoutUser(refreshToken: string) {
    if (!refreshToken) {
      throw new AuthenticationError("Refresh token is missing.");
    }

    const secret = process.env.JSON_WEB_REFRESH_SECRET as Secret;

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(refreshToken, secret) as JwtPayload;
    } catch (err) {
      throw new AuthenticationError("Invalid refresh token.");
    }

    const userId = decoded.id;

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshToken: null,
        refreshTokenExpiry: null,
      },
    });

    if (!user) {
      throw new Error("Failed to log out or user not found.");
    }

    return {
      message: "User successfully logged out.",
    };
  }
  public async registerUser(input: {
    fullname: string;
    email: string;
    password: string;
    dob: string;
    phone: string;
    address: string;
    city: string;
    postcode: string;
  }) {
    const { fullname, email, password, dob, phone, address, city, postcode } =
      input;
    if (
      !fullname ||
      !email ||
      !password ||
      !dob ||
      !phone ||
      !address ||
      !city ||
      !postcode
    ) {
      throw new UserInputError("All fields are required.");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new UserInputError("Email is already in use.");
    }

    const hashedPassword = await SecurityService.hashPassword(password);

    const user = await prisma.user.create({
      data: {
        fullname,
        email,
        password: hashedPassword,
        dob: new Date(dob),
        phone,
        address,
        city,
        postcode,
        userRoles: {
          create: [{ role: { connect: { name: "User" } } }],
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    const roles = user.userRoles.map((userRole: any) => userRole.role.name);

    const token = AuthorizationTokenService.generateTokens({
      id: user.id,
      email: user.email,
      roles,
    });

    return { token, user };
  }

  public async requestPasswordReset(email: string) {
  
    const user = await UserService.findUserByEmail(email);
    if (!user) {
      throw new Error(
        "If the email is associated with an account, you will receive a reset link."
      );
    }
  
    const { resetToken, resetTokenExpiry } = AuthorizationTokenService.generateResetToken();
  
    const hashedResetToken = createHash("sha256")
      .update(resetToken)
      .digest("hex");
  
    await prisma.user.update({
      where: { email },
      data: { resetToken: hashedResetToken, resetTokenExpiry },
    });
  
    const resetLink = `${process.env.FRONTEND_URL}/account/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  
    const subject = "Password Reset";
    const templatePath = "reset-password.hbs";
    const context = { resetLink };
  
    await EmailService.sendMail({
      from: process.env.EMAIL_FROM!,
      to: user.email,
      subject,
      context,
      templatePath,
    });
  
    return { message: "Password reset token sent to email" };
  }

  public async resetPassword(
    token: string,
    newPassword: string,
    email: string
  ) {
    const hashedResetToken = createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        email,
        resetToken: hashedResetToken,
        resetTokenExpiry: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error("Invalid or expired reset token.");
    }

    const hashedPassword = await SecurityService.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: "Password successfully reset" };
  }
  public async changeUserPassword(
    id: number,
    newPassword: string,
    oldPassword: string
  ) {
    try {
      const user = await UserService.getCurrentPassword(id);
      if (!user) {
        throw new Error("User not found");
      }

      const isOldPasswordValid = await SecurityService.comparePassword(
        oldPassword,
        user.password
      );

      if (!isOldPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      const hashedNewPassword = await SecurityService.hashPassword(newPassword);

      await prisma.user.update({
        where: { id },
        data: { password: hashedNewPassword },
      });

      return { message: "Password successfully reset" };
    } catch (error) {
      console.error("Error during password change:", error);
      const errorMessage = (error as Error).message;
      throw new Error(` ${errorMessage}`);
    }
  }
}

export default new AuthenticationService();
