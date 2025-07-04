import { Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../server";
import SecurityService from "../security";
import EmailService from "../email";
import RoleService from "../roles"; // Import RoleService
import { UserInputError } from "apollo-server";
import moment from "moment";


class UserService {
  public async getUsers(
    page: number = 1,
    limit: number = 10,
    search: string = ""
  ) {
    try {
      const offset = ( page - 1 ) * limit;
      const [users, totalCount] = await Promise.all( [
        prisma.user.findMany( {
          where: {
            OR: [
              {
                fullname: {
                  contains: search,
                },
              },
              {
                email: {
                  contains: search,
                },
              },
            ],
          },
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
          skip: offset,
          take: limit,
        } ),
        prisma.user.count( {
          where: {
            OR: [
              {
                fullname: {
                  contains: search,
                },
              },
              {
                email: {
                  contains: search,
                },
              },
            ],
          },
        } ),
      ] );

      const formattedUsers = users.map( ( user ) => ( {
        ...user,
        dob: user.dob ? moment( user.dob ).format( "YYYY-MM-DD" ) : null,
      } ) );

      return {
        users: formattedUsers,
        totalCount,
        totalPages: Math.ceil( totalCount / limit ),
        currentPage: page,
      };
    } catch ( error ) {
      throw new Error( "Failed to retrieve users" );
    }
  }

  public async getUserById(id: number): Promise<any | null> {
    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            userRoles: {
                include: {
                    role: true,
                },
            },
        },
    });

    if (!user) return null;

    return {
        id: user.id,
        email: user.email,
        roles: user.userRoles.map((userRole) => userRole.role.name),
    };
}

  public async getCurrentPassword( id: number ): Promise<any> {
    const user = await prisma.user.findUnique( {
      where: { id }, // Use the passed in `id` directly
      select: {
        password: true,
      },
    } );

    if ( !user || !user.password ) {
      throw new Error( "Password not found for the user" );
    }

    return user;
  }

  public async getVerificationStatus( userId: number ) {
    try {
      const user = await prisma.user.findUnique( {
        where: {
          id: userId,
        },
        select: {
          emailVerified: true,
        },
      } );

      if ( !user ) {
        throw new Error( "User not found" );
      }

      return {
        emailVerified: user.emailVerified,
        message: user.emailVerified
          ? "Your account is already verified."
          : "Your account is not verified yet.",
      };
    } catch ( error ) {
      console.error( "Error fetching verification status:", error );
      throw new Error( "Could not fetch verification status." );
    }
  }

  public async findUserByEmail( email: string ) {
    try {
      return await prisma.user.findUnique( {
        where: { email },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      } );
    } catch ( error ) {
      throw new Error( "Something went wrong!" );
    }
  }

  public async createUser( data: {
    input: {
      fullname: string;
      email: string;
      password: string;
      dob: string;
      phone: string;
      address: string;
      city: string;
      postcode: string;
      roles: number[];
    };
  } ) {
    const existingUser = await prisma.user.findUnique( {
      where: { email: data.input.email.toLowerCase() },
    } );
    if ( existingUser ) throw new Error( "User with this email already exists" );

    const hashedPassword = await SecurityService.hashPassword(
      data.input.password
    );
    const formattedData = {
      ...data.input,
      password: hashedPassword,
      email: data.input.email.toLowerCase(),
      dob: new Date( data.input.dob ).toISOString(),
      phone: data.input.phone,
    };

    const roles = data.input.roles?.length
      ? await RoleService.getAllRoles()
      : await prisma.role.findMany( { where: { name: "USER" } } );

    try {
      const user = await prisma.user.create( {
        data: {
          ...formattedData,
          userRoles: {
            create: roles.map( ( role ) => ( {
              role: { connect: { id: role.id } },
            } ) ),
          },
        },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      } );

      return user;
    } catch ( error ) {
      console.error( error, "error" );
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        Array.isArray( error.meta?.target ) &&
        error.meta?.target.includes( "email" )
      ) {
        throw new Error( "An account with this email already exists" );
      }
      console.error( error, "error" );
      throw new Error( "Failed to create user" );
    }
  }

  public async deleteUser( id: number ) {
    try {
      const user = await prisma.user.findUnique( { where: { id } } );
      if ( !user ) {
        throw new Error( `User with ID ${id} does not exist` );
      }

      await prisma.userRole.deleteMany( { where: { userId: id } } );
      await prisma.user.delete( { where: { id } } );

      return { message: "User account deleted successfully" };
    } catch ( error ) {
      console.error( "Error deleting user:", error );
      if ( error instanceof Error ) {
        throw new Error( error.message );
      }
      throw new Error( "Failed to delete user account" );
    }
  }

  public async updateUserRoles( userId: number, roles: string[] ) {
    try {
      await prisma.userRole.deleteMany( {
        where: { userId },
      } );

      const updatedUser = await prisma.user.update( {
        where: { id: userId },
        data: {
          userRoles: {
            create: roles.map( ( role ) => ( {
              role: {
                connect: { name: role },
              },
            } ) ),
          },
        },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      } );

      return updatedUser;
    } catch ( error ) {
      throw new Error( "Failed to update user roles" );
    }
  }

  public async updateUser(
    id: number,
    data: {
      fullname?: string;
      email?: string;
      dob?: string;
    }
  ) {
    const { fullname, dob, email } = data;
    try {
      if ( !fullname || !email || !dob ) {
        throw new UserInputError( "All fields are required." );
      }

      const dobAsDate = new Date( parseInt( dob ) * 1000 );
      const updatedUser = await prisma.user.update( {
        where: { id },
        data: {
          fullname: fullname,
          email: email,
          dob: dobAsDate,
        },
      } );

      return updatedUser;
    } catch ( error ) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        Array.isArray( error.meta?.target ) &&
        error.meta?.target.includes( "email" )
      ) {
        throw new Error( "Email is already in use" );
      }
      throw new Error( "Failed to update user" );
    }
  }

  public async updateUserAddress(
    id: number,
    data: {
      phone?: string;
      address?: string;
      city?: string;
      postcode?: string;
    }
  ) {
    try {
      const updatedUser = await prisma.user.update( {
        where: { id },
        data: {
          phone: data.phone,
          address: data.address,
          city: data.city,
          postcode: data.postcode,
        },
      } );

      return updatedUser;
    } catch ( error ) {
      throw new Error( "Failed to update user address" );
    }
  }

  public async sendVerificationEmail(id: number) {
    try {
        const user = await prisma.user.findUnique({ where: { id } });

        if (!user || !user.email) {
            throw new Error("User not found or email not provided");
        }

        const verificationToken = uuidv4();
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.user.update({
            where: { id },
            data: { verificationToken, verificationTokenExpiry },
        });

        const subject = "Email Verification";
        const verificationUrl = `${process.env.FRONTEND_URL}/account/verify-email?token=${verificationToken}`;

        const context = {
            token: verificationToken,
            verificationUrl,
        };

        const templatePath = 'verify-email.hbs';

        await EmailService.sendMail({
            from: process.env.EMAIL_FROM!,
            to: user.email,
            subject,
            context,
            templatePath,
        });

        return { success: true, message: "Verification email sent" };
    } catch (error: any) {
        console.error('UserService: Error sending verification email:', error);
        if (error.message === "User not found or email not provided") {
            throw error;
        }
        throw new Error("Failed to send verification email");
    }
  }

  public async resendVerificationEmail(userId: number) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.email) {
            throw new Error("User not found or email not provided");
        }

        // Create a new verification token and set expiry
        const verificationToken = uuidv4();
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry

        // Update user record with new verification token and expiry
        await prisma.user.update({
            where: { id: userId },
            data: { verificationToken, verificationTokenExpiry },
        });

        // Send the verification email with the new token
        const verificationUrl = `${process.env.FRONTEND_URL}/account/verify-email?token=${verificationToken}`;
        const context = {
            token: verificationToken,
            verificationUrl,
        };

        const subject = "Email Verification";
        const templatePath = 'verify-email.hbs';

        await EmailService.sendMail({
            from: process.env.EMAIL_FROM!,
            to: user.email,
            subject,
            context,
            templatePath,
        });

        return { success: true, message: "Verification email sent successfully." };
    } catch (error) {
        console.error('Error in resendVerificationEmail:', error);
        throw new Error("Failed to resend the verification email.");
    }
  }

  public async verifyEmail(token: string) {
    try {
      const user = await prisma.user.findFirst( {
        where: {
          verificationToken: token,
          verificationTokenExpiry: {
            gte: new Date(),
          },
        },
      } );

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

        return { message: "Email successfully verified." };
    } catch (error) {
        console.error("Verification failed:", error);
        throw new Error("Failed to verify email. Please try again later.");
    }
  }

}

export default new UserService();
