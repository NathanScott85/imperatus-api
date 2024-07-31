import { prisma } from "../../server";

class RoleService {
  public async getAllRoles() {
    return await prisma.role.findMany();
  }

  public async getRoleByName(name: string) {
    return await prisma.role.findUnique({
      where: { name },
    });
  }

  public async createRole(name: string) {
    return await prisma.role.create({
      data: { name },
    });
  }

  public async deleteRole(name: string) {
    return await prisma.role.delete({
      where: { name },
    });
  }

  public async assignRoleToUser(userId: number, roleName: string) {
    // Find the role by name
    const role = await this.getRoleByName(roleName);
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    // Find the user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
      },
    });
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Check if the user already has the role
    const userHasRole = user.roles.some(
      (userRole) => userRole.roleId === role.id
    );
    if (userHasRole) {
      throw new Error(`User already has the role ${roleName}`);
    }

    // Assign the role to the user
    await prisma.userRole.create({
      data: {
        user: { connect: { id: userId } },
        role: { connect: { id: role.id } },
      },
    });

    return { message: `Role ${roleName} assigned to user ${userId}` };
  }
}

export default new RoleService();
