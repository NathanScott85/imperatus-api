import SecurityService from ".";

describe("SecurityService", () => {
  describe("hashPassword", () => {
    it("should hash the password correctly", async () => {
      const password = "password123";
      const hashedPassword = await SecurityService.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
    });
  });

  describe("comparePassword", () => {
    it("should return true for correct password", async () => {
      const password = "password123";
      const hashedPassword = await SecurityService.hashPassword(password);

      const isValid = await SecurityService.comparePassword(
        password,
        hashedPassword
      );

      expect(isValid).toBe(true);
    });

    it("should return false for incorrect password", async () => {
      const password = "password123";
      const hashedPassword = await SecurityService.hashPassword(password);

      const isValid = await SecurityService.comparePassword(
        "wrongpassword",
        hashedPassword
      );

      expect(isValid).toBe(false);
    });

    it("should handle password case insensitivity correctly", async () => {
      const password = "Password123";
      const hashedPassword = await SecurityService.hashPassword(
        password.toLowerCase()
      );

      const isValid = await SecurityService.comparePassword(
        password.toLowerCase(),
        hashedPassword
      );

      expect(isValid).toBe(true);
    });
  });
});
