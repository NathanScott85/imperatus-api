import { prisma } from "../../server";

class RoleService {
  public async getAllRoles() {
    return await prisma.role.findMany();
  }

  public async getRolesByUserId(userId: number) {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
    });

    const roleIds = userRoles.map((userRole) => userRole.roleId);

    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
    });
    return roles;
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
    const role = await this.getRoleByName(roleName);
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: true,
      },
    });
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const userHasRole = user.userRoles.some(
      (userRole) => userRole.roleId === role.id
    );
    if (userHasRole) {
      throw new Error(`User already has the role ${roleName}`);
    }

    await prisma.userRole.create({
      data: {
        user: { connect: { id: userId } },
        role: { connect: { id: role.id } },
      },
    });

    return { message: `Role ${roleName} assigned to user ${userId}` };
  }

  public async addRoles(roleNames: string[]) {
    const existingRoles = await this.getAllRoles();
    const existingRoleNames = existingRoles.map((role) => role.name);

    const rolesToCreate = roleNames.filter(
      (roleName) => !existingRoleNames.includes(roleName)
    );

    const createdRoles = [];
    for (const roleName of rolesToCreate) {
      const createdRole = await this.createRole(roleName);
      createdRoles.push(createdRole);
    }

    return createdRoles;
  }

  public async getUserRoles(userId: number) {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    return userRoles;
  }

  public async getRoles(roleId: number) {
    const roles = await prisma.role.findMany({
      where: { id: roleId },
    });

    return roles;
  }
}

export default new RoleService();
