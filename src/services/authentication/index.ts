import { AuthenticationError, UserInputError } from "apollo-server";
import jwt, { GetPublicKeyOrSecret, Secret } from "jsonwebtoken";
import { prisma } from "../../server";
import SecurityService from "../security";
import UserService from "../users";
import AuthorizationTokenService from "../token";
import EmailService from "../email";
import RoleService from "../roles"; // Import RoleService
import { createHash } from "crypto";

interface JwtPayload {
  id: number; // Ensure this matches the type of User.id in Prisma schema
  email: string;
  roles: string[];
}

class AuthenticationService {
  public async loginUser(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (
      !user ||
      !(await SecurityService.comparePassword(password, user.password))
    ) {
      throw new Error("Invalid email or password");
    }

    // Retrieve user's roles
    const rolesService = await RoleService.getUserRoles(user.id);

    // Map roles to extract the role names
    const roles = rolesService.map((roleObject) => roleObject.role.name);

    // Generate JWT token with user's information
    const { accessToken, refreshToken } =
      AuthorizationTokenService.generateTokens({
        id: user.id,
        email: user.email,
        roles,
      });

    // Store refresh token in the database
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken: refreshToken,
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Return the token and user data
    return {
      refreshToken,
      accessToken,
      user: {
        ...user,
        roles,
      },
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
    // Validate input
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

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new UserInputError("Email is already in use.");
    }

    // Hash the password
    const hashedPassword = await SecurityService.hashPassword(password);

    // Create the new user in the database
    const user = await prisma.user.create({
      data: {
        fullname,
        email,
        password: hashedPassword,
        dob: new Date(dob), // Ensure dob is a Date type
        phone,
        address,
        city,
        postcode,
        userRoles: {
          create: [{ role: { connect: { name: "User" } } }], // Assign default role
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

    // Extract roles
    const roles = user.userRoles.map((userRole: any) => userRole.role.name);

    // Generate JWT token
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
      // Generic error to prevent information leakage
      throw new Error(
        "If the email is associated with an account, you will receive a reset link."
      );
    }

    const { resetToken, resetTokenExpiry } =
      AuthorizationTokenService.generateResetToken();

    // Hash the reset token before storing it
    const hashedResetToken = createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Store the hashed token and expiry in the database
    await prisma.user.update({
      where: { email },
      data: { resetToken: hashedResetToken, resetTokenExpiry },
    });

    // Send the email with the reset link
    const resetLink = `${
      process.env.FRONTEND_URL
    }/account/reset-password?token=${resetToken}&email=${encodeURIComponent(
      email
    )}`;

    const mailOptions = {
      from: process.env.EMAIL_USER || "no-reply@imperatus.co.uk",
      to: user.email,
      subject: "Password Reset",
      text: `Please reset your password by clicking the following link: ${resetLink}`,
      html: `<p>Please reset your password by clicking the following link: <a href="${resetLink}">Reset Password</a></p>`,
    };

    await EmailService.sendMail(mailOptions);

    return { message: "Password reset token sent to email" };
  }

  public async resetPassword(
    token: string,
    newPassword: string,
    email: string
  ) {
    // Hash the incoming token for comparison
    const hashedResetToken = createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        email,
        resetToken: hashedResetToken,
        resetTokenExpiry: {
          gte: new Date(), // Ensure token is not expired
        },
      },
    });

    if (!user) {
      // Invalid or expired token error
      throw new Error("Invalid or expired reset token.");
    }

    // Hash the new password
    const hashedPassword = await SecurityService.hashPassword(newPassword);

    // Update user's password and clear token fields
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
