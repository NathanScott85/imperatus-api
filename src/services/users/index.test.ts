import { Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import UserService from "../users";
import SecurityService from "../security";
import EmailService from "../email";
import { prisma } from "../../server";

jest.mock("../security");
jest.mock("../../server", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    userRole: {
      deleteMany: jest.fn(),
    },
    role: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("uuid", () => ({
  v4: jest.fn(),
}));

jest.mock("../email", () => ({
  sendMail: jest.fn(),
}));

describe("UserService", () => {
  const mockUser = {
    id: 1,
    email: "test@example.com",
    fullname: "Test User",
    password: "$2b$10$hashedpassword",
    dob: new Date("1990-01-01").toISOString(),
    phone: "1234567890",
    address: "123 Test St",
    city: "Test City",
    postcode: "12345",
    roles: [{ role: { name: "USER" } }],
  };

  describe("getUsers", () => {
    it("should retrieve users", async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      const users = await UserService.getUsers();

      expect(users).toEqual([mockUser]);
      expect(prisma.user.findMany).toHaveBeenCalled();
    });

    it("should throw an error if retrieval fails", async () => {
      (prisma.user.findMany as jest.Mock).mockRejectedValue(
        new Error("Failed to retrieve users")
      );

      await expect(UserService.getUsers()).rejects.toThrow(
        "Failed to retrieve users"
      );
    });
  });

  describe("getUserById", () => {
    it("should retrieve user by ID", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const user = await UserService.getUserById(1);

      expect(user).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { roles: { include: { role: true } } },
      });
    });

    it("should throw an error if retrieval fails", async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error("Failed to retrieve user by ID")
      );

      await expect(UserService.getUserById(1)).rejects.toThrow(
        "Failed to retrieve user by ID"
      );
    });
  });

  describe("findUserByEmail", () => {
    it("should retrieve user by email", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const user = await UserService.findUserByEmail("test@example.com");

      expect(user).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        include: { roles: { include: { role: true } } },
      });
    });

    it("should throw an error if retrieval fails", async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error("Failed to retrieve user by email")
      );

      await expect(
        UserService.findUserByEmail("test@example.com")
      ).rejects.toThrow("Failed to retrieve user by email");
    });
  });

  describe("createUser", () => {
    it("should create a new user", async () => {
      (SecurityService.hashPassword as jest.Mock).mockResolvedValue(
        "hashedpassword"
      );
      (prisma.role.findMany as jest.Mock).mockResolvedValue([
        { id: 1, name: "USER" },
      ]);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const data = {
        fullname: "Test User",
        email: "test@example.com",
        password: "password",
        dob: "1990-01-01",
        phone: "1234567890",
        address: "123 Test St",
        city: "Test City",
        postcode: "12345",
      };

      const user = await UserService.createUser(data);

      expect(user).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it("should throw an error if email is already in use", async () => {
      const error = new Prisma.PrismaClientKnownRequestError("Error", {
        code: "P2002",
        clientVersion: "client_version",
        meta: { target: ["email"] },
      });
      (prisma.role.findMany as jest.Mock).mockResolvedValue([
        { id: 1, name: "USER" },
      ]);
      (prisma.user.create as jest.Mock).mockRejectedValue(error);

      const data = {
        fullname: "Test User",
        email: "test@example.com",
        password: "password",
        dob: "1990-01-01",
        phone: "1234567890",
        address: "123 Test St",
        city: "Test City",
        postcode: "12345",
      };

      await expect(UserService.createUser(data)).rejects.toThrow(
        "Email is already in use"
      );
    });
  });

  describe("deleteUser", () => {
    it("should delete a user by ID", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.userRole.deleteMany as jest.Mock).mockResolvedValue(undefined);
      (prisma.user.delete as jest.Mock).mockResolvedValue(undefined);

      const result = await UserService.deleteUser(1);

      expect(result).toEqual({ message: "User account deleted successfully" });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(prisma.userRole.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it("should throw an error if the user does not exist", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(UserService.deleteUser(1)).rejects.toThrow(
        "User with ID 1 does not exist"
      );
    });
  });

  describe("updateUserRoles", () => {
    it("should update user roles", async () => {
      (prisma.userRole.deleteMany as jest.Mock).mockResolvedValue(undefined);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.updateUserRoles(1, ["ADMIN"]);

      expect(result).toEqual(mockUser);
      expect(prisma.userRole.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it("should throw an error if update fails", async () => {
      (prisma.userRole.deleteMany as jest.Mock).mockRejectedValue(
        new Error("Failed to update user roles")
      );

      await expect(UserService.updateUserRoles(1, ["ADMIN"])).rejects.toThrow(
        "Failed to update user roles"
      );
    });
  });

  describe("updateUser", () => {
    it("should update a user", async () => {
      (SecurityService.hashPassword as jest.Mock).mockResolvedValue(
        "hashedpassword"
      );
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      const data = {
        fullname: "Updated User",
        email: "updated@example.com",
        password: "newpassword",
        dob: "1990-01-01",
        phone: "0987654321",
        address: "456 Updated St",
        city: "Updated City",
        postcode: "67890",
      };

      const user = await UserService.updateUser(1, data);

      expect(user).toEqual(mockUser);
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it("should throw an error if email is already in use", async () => {
      const error = new Prisma.PrismaClientKnownRequestError("Error", {
        code: "P2002",
        clientVersion: "client_version",
        meta: { target: ["email"] },
      });
      (prisma.user.update as jest.Mock).mockRejectedValue(error);

      await expect(
        UserService.updateUser(1, { email: "new@example.com" })
      ).rejects.toThrow("Email is already in use");
    });
  });

  describe("sendVerificationEmail", () => {
    const mockUser = {
      id: 1,
      fullname: "John Doe",
      email: "john.doe@example.com",
      password: "password123",
      dob: "1990-01-01",
      phone: "1234567890",
      address: "123 Main St",
      city: "Anytown",
      postcode: "12345",
      roles: ["USER"],
    };

    it("should send a verification email", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (uuidv4 as jest.Mock).mockReturnValue("validtoken");
      (prisma.user.update as jest.Mock).mockResolvedValue(undefined);
      (EmailService.sendMail as jest.Mock).mockResolvedValue(undefined);

      const result = await UserService.sendVerificationEmail(1);

      expect(result).toEqual({ message: "Verification email sent" });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          verificationToken: "validtoken",
          verificationTokenExpiry: expect.any(Date),
        },
      });
      expect(EmailService.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: mockUser.email,
        subject: "Email Verification",
        text: `Please verify your email by using the following token: validtoken`,
        html: `<p>Please verify your email by using the following token: <strong>validtoken</strong></p>`,
      });
    });

    it("should throw an error if the user is not found", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(UserService.sendVerificationEmail(1)).rejects.toThrow(
        "User not found"
      );
    });
  });

  describe("verifyEmail", () => {
    const mockUser = {
      id: 1,
      fullname: "John Doe",
      email: "john.doe@example.com",
      password: "password123",
      dob: "1990-01-01",
      phone: "1234567890",
      address: "123 Main St",
      city: "Anytown",
      postcode: "12345",
      roles: ["USER"],
    };

    it("should verify email successfully", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(undefined);

      const result = await UserService.verifyEmail("validtoken");

      expect(result).toEqual({ message: "Email successfully verified" });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          verificationToken: null,
          verificationTokenExpiry: null,
          emailVerified: true,
        },
      });
    });

    it("should throw an error if the token is invalid or expired", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(UserService.verifyEmail("invalidtoken")).rejects.toThrow(
        "Invalid or expired verification token"
      );
    });
  });
});
