import { Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../server";
import SecurityService from "../security";
import EmailService from "../email";

class UserService {
  public async getUsers() {
    try {
      return await prisma.user.findMany({
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });
    } catch (error) {
      throw new Error("Failed to retrieve users");
    }
  }

  public async getUserById(id: number) {
    try {
      return await prisma.user.findUnique({
        where: { id },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });
    } catch (error) {
      throw new Error("Failed to retrieve user by ID");
    }
  }

  public async findUserByEmail(email: string) {
    try {
      return await prisma.user.findUnique({
        where: { email },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });
    } catch (error) {
      throw new Error("Failed to retrieve user by email");
    }
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
    roles?: string[];
  }) {
    const hashedPassword = await SecurityService.hashPassword(data.password);

    const formattedData = {
      ...data,
      password: hashedPassword,
      email: data.email.toLowerCase(),
      dob: new Date(data.dob).toISOString(),
      phone: data.phone,
    };

    // Fetch the role(s) from the database
    const roles = data.roles?.length
      ? await prisma.role.findMany({
          where: {
            name: {
              in: data.roles,
            },
          },
        })
      : await prisma.role.findMany({
          where: {
            name: "USER",
          },
        });

    try {
      const user = await prisma.user.create({
        data: {
          ...formattedData,
          roles: {
            create: roles.map((role) => ({
              role: {
                connect: { id: role.id },
              },
            })),
          },
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      return user;
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
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new Error(`User with ID ${id} does not exist`);
      }

      await prisma.userRole.deleteMany({ where: { userId: id } });
      await prisma.user.delete({ where: { id } });

      return { message: "User account deleted successfully" };
    } catch (error) {
      console.error("Error deleting user:", error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error("Failed to delete user account");
    }
  }

  public async updateUserRoles(userId: number, roles: string[]) {
    try {
      await prisma.userRole.deleteMany({
        where: { userId },
      });

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          roles: {
            create: roles.map((role) => ({
              role: {
                connect: { name: role },
              },
            })),
          },
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      return updatedUser;
    } catch (error) {
      throw new Error("Failed to update user roles");
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
      roles?: string[];
    }
  ) {
    if (data.password) {
      data.password = await SecurityService.hashPassword(data.password);
    }
    if (data.dob) {
      data.dob = new Date(data.dob).toISOString();
    }

    try {
      // Update user details
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          fullname: data.fullname,
          email: data.email,
          password: data.password,
          dob: data.dob,
          phone: data.phone,
          address: data.address,
          city: data.city,
          postcode: data.postcode,
        },
      });

      // Update roles if provided
      if (data.roles) {
        // Remove existing roles
        await prisma.userRole.deleteMany({
          where: { userId: id },
        });

        // Add new roles
        await prisma.user.update({
          where: { id },
          data: {
            roles: {
              create: data.roles.map((role) => ({
                role: {
                  connect: { name: role },
                },
              })),
            },
          },
        });
      }

      return updatedUser;
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

  public async sendVerificationEmail(userId: number) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error("User not found");
      }

      const verificationToken = uuidv4();
      const verificationTokenExpiry = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      );

      await prisma.user.update({
        where: { id: userId },
        data: { verificationToken, verificationTokenExpiry },
      });

      const subject = "Email Verification";
      const text = `Please verify your email by using the following token: ${verificationToken}`;
      const html = `<p>Please verify your email by using the following token: <strong>${verificationToken}</strong></p>`;

      await EmailService.sendMail({
        from: process.env.EMAIL_USER!,
        to: user.email,
        subject,
        text,
        html,
      });

      return { message: "Verification email sent" };
    } catch (error: any) {
      if (error.message === "User not found") {
        throw error;
      }
      throw new Error("Failed to send verification email");
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
    } catch (error: any) {
      if (error.message === "Invalid or expired verification token") {
        throw error; // Propagate the specific error
      }
      throw new Error("Failed to verify email");
    }
  }
}

export default new UserService();
