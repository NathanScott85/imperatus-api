import { prisma } from "../../server";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import AuthService from "../auth";

class UserService {
  public async getUsers() {
    try {
      return await prisma.user.findMany();
    } catch (error) {
      throw new Error("Failed to retrieve users");
    }
  }

  public async getUserById(id: number) {
    try {
      return await prisma.user.findUnique({ where: { id } });
    } catch (error) {
      throw new Error("Failed to retrieve user by ID");
    }
  }

  public async findUserByEmail(email: string) {
    try {
      return await prisma.user.findUnique({ where: { email } });
    } catch (error) {
      throw new Error("Failed to retrieve user by email");
    }
  }

  public async loginUser(email: string, password: string) {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isValid = await bcrypt.compare(password.toLowerCase(), user.password);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    const token = AuthService.generateToken({
      id: user.id,
      email: user.email,
      admin: user.admin,
    });
    return { token, user };
  }

  public async createUser(data: {
    fullname: string;
    email: string;
    password: string;
    dob: string;
    phone: string;
    address: string;
    city: string;
    postcode: string;
    admin: boolean;
  }) {
    const lowercasePassword = data.password.toLowerCase();
    const hashedPassword = await bcrypt.hash(lowercasePassword, 10);

    const formattedData = {
      ...data,
      password: hashedPassword,
      email: data.email.toLowerCase(),
      dob: new Date(data.dob).toISOString(),
      phone: data.phone,
    };

    try {
      return await prisma.user.create({
        data: formattedData,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        Array.isArray(error.meta?.target) &&
        error.meta?.target.includes("email")
      ) {
        throw new Error("Email is already in use");
      }
      throw new Error("Failed to create user");
    }
  }

  public async deleteUser(id: number) {
    try {
      await prisma.user.delete({ where: { id } });
      return { message: "User account deleted successfully" };
    } catch (error) {
      throw new Error("Failed to delete user account");
    }
  }

  public async updateUser(
    id: number,
    data: {
      fullname?: string;
      email?: string;
      password?: string;
      dob?: string;
      phone?: string;
      address?: string;
      city?: string;
      postcode?: string;
      admin?: boolean;
    }
  ) {
    if (data.password) {
      const lowercasePassword = data.password.toLowerCase();
      data.password = await bcrypt.hash(lowercasePassword, 10);
    }
    if (data.dob) {
      data.dob = new Date(data.dob).toISOString();
    }

    try {
      return await prisma.user.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        Array.isArray(error.meta?.target) &&
        error.meta?.target.includes("email")
      ) {
        throw new Error("Email is already in use");
      }
      throw new Error("Failed to update user");
    }
  }

  public async verifyEmail(token: string) {
    try {
      const user = await prisma.user.findFirst({
        where: {
          verificationToken: token,
          verificationTokenExpiry: {
            gte: new Date(),
          },
        },
      });

      if (!user) {
        throw new Error("Invalid or expired verification token");
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken: null,
          verificationTokenExpiry: null,
          emailVerified: true,
        },
      });

      return { message: "Email successfully verified" };
    } catch (error) {
      throw new Error("Failed to verify email");
    }
  }

  public async requestPasswordReset(email: string) {
    try {
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new Error("User with this email does not exist");
      }

      const resetToken = uuidv4();
      const resetTokenExpiry = new Date(Date.now() + 3600000);

      await prisma.user.update({
        where: { email },
        data: { resetToken, resetTokenExpiry },
      });

      //TODO: implement functionality send email to the user with the resetToken

      return { message: "Password reset token sent to email" };
    } catch (error) {
      throw new Error("Failed to request password reset");
    }
  }

  public async resetPassword(token: string, newPassword: string) {
    try {
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

      const hashedPassword = await bcrypt.hash(newPassword.toLowerCase(), 10);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      return { message: "Password successfully reset" };
    } catch (error) {
      throw new Error("Failed to reset password");
    }
  }
}

export default new UserService();
