import { prisma } from "../../server";
import SecurityService from "../security";
import UserService from "../users";
import AuthorizationTokenService from "../token";
import EmailService from "../email";
import RoleService from "../roles"; // Import RoleService

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

    const roles = await RoleService.getUserRoles(user.id);

    const token = AuthorizationTokenService.generateToken({
      id: user.id,
      email: user.email,
      roles: roles.map((role) => role.role.name),
    });

    return {
      token,
      user: {
        ...user,
        roles,
      },
    };
  }
  // public async registerUser(input: {
  //   fullname: string;
  //   email: string;
  //   password: string;
  //   dob: string;
  //   phone: string;
  //   address: string;
  //   city: string;
  //   postcode: string;
  // }) {
  //   const user = await UserService.createUser({
  //     ...input,
  //   });

  //   const roles = user.roles
  //     .map((user: any) => user.role?.name)
  //     .filter(Boolean);
  //   await UserService.sendVerificationEmail(user.id);

  //   const token = AuthorizationTokenService.generateToken({
  //     id: user.id,
  //     email: user.email,
  //     roles: roles,
  //   });

  //   return { token, user };
  // }

  public async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error("User with this email does not exist");
    }

    const { resetToken, resetTokenExpiry } =
      AuthorizationTokenService.generateResetToken();

    await prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExpiry },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER || "no-reply@example.com",
      to: user.email,
      subject: "Password Reset",
      text: `Please reset your password by using the following token: ${resetToken}`,
      html: `<p>Please reset your password by using the following token: <strong>${resetToken}</strong></p>`,
    };

    await EmailService.sendMail(mailOptions);

    return { message: "Password reset token sent to email" };
  }

  public async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error("Invalid or expired reset token");
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
}

export default new AuthenticationService();
