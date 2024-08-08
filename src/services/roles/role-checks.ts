import { AuthenticationError } from "apollo-server";

export const hasRole = (user: any, roleName: string): boolean => {
  if (!user.roles) {
    throw new AuthenticationError("User does not have roles assigned.");
  }
  return user.roles.includes(roleName);
};

export const isAdmin = (user: any) => {
  return hasRole(user, "ADMIN");
};

export const isOwner = (user: any) => {
  return hasRole(user, "OWNER");
};

export const isAdminOrOwner = (user: any) => {
  return isAdmin(user) || isOwner(user);
};
