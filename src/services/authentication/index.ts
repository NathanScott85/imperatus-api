import { UserInputError } from "apollo-server";
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

    // Retrieve user's roles
    const rolesService = await RoleService.getUserRoles(user.id);

    // Map roles to extract the role names
    const roles = rolesService.map((roleObject) => roleObject.role.name);

    // Generate JWT token with user's information
    const token = AuthorizationTokenService.generateToken({
      id: user.id,
      email: user.email,
      roles,
    });

    // Return the token and user data
    return {
      token,
      user: {
        ...user,
        roles,
      },
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

    // Send verification email
    await UserService.sendVerificationEmail(user.id);

    // Generate JWT token
    const token = AuthorizationTokenService.generateToken({
      id: user.id,
      email: user.email,
      roles,
    });

    return { token, user };
  }

  public async requestPasswordReset(email: string) {
    const user = await UserService.findUserByEmail(email);
    const { resetToken, resetTokenExpiry } =
      AuthorizationTokenService.generateResetToken();

    if (!user) {
      throw new Error("User with this email does not exist");
    }

    await prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExpiry },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER || "no-reply@imperatus.co.uk",
      to: user.email,
      subject: "Password Reset",
      text: `Please reset your password by using the following token: ${resetToken}`,
      html: `<p>Please reset your password by using the following token: <strong>${resetToken}</strong></p>`,
    };

    await EmailService.sendMail(mailOptions);

    return { message: "Password reset token sent to email" };
  }

  public async resetPassword(
    token: string,
    newPassword: string,
    email: string
  ) {
    // Find the user with the given reset token and ensure the token has not expired
    const user = await prisma.user.findFirst({
      where: {
        email, // Use the email to confirm the user
        resetToken: token,
        resetTokenExpiry: {
          gte: new Date(), // Ensure the token has not expired
        },
      },
    });

    if (!user) {
      throw new Error("Invalid or expired reset token.");
    }

    // Hash the new password
    const hashedPassword = await SecurityService.hashPassword(newPassword);

    // Update the user's password and reset the token fields
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
