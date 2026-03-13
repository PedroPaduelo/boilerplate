import {
  createUserSchema,
  updateUserSchema,
  loginSchema,
  userQuerySchema
} from '@/lib/validators/user';

describe('User Validators', () => {
  describe('createUserSchema', () => {
    it('should validate a valid user input', () => {
      const validInput = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'USER'
      };

      const result = createUserSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should validate without role (uses default)', () => {
      const validInput = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const result = createUserSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('USER');
      }
    });

    it('should reject invalid email', () => {
      const invalidInput = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      const result = createUserSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidInput = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123'
      };

      const result = createUserSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const invalidInput = {
        name: '',
        email: 'john@example.com',
        password: 'password123'
      };

      const result = createUserSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject invalid role', () => {
      const invalidInput = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'SUPER_ADMIN'
      };

      const result = createUserSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('updateUserSchema', () => {
    it('should validate partial update', () => {
      const validInput = {
        name: 'Updated Name'
      };

      const result = updateUserSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should validate email update', () => {
      const validInput = {
        email: 'newemail@example.com'
      };

      const result = updateUserSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email on update', () => {
      const invalidInput = {
        email: 'invalid-email'
      };

      const result = updateUserSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login input', () => {
      const validInput = {
        email: 'john@example.com',
        password: 'password123'
      };

      const result = loginSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidInput = {
        email: 'invalid-email',
        password: 'password123'
      };

      const result = loginSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const invalidInput = {
        email: 'john@example.com',
        password: ''
      };

      const result = loginSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('userQuerySchema', () => {
    it('should use default pagination values', () => {
      const emptyInput = {};
      const result = userQuerySchema.safeParse(emptyInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(10);
      }
    });

    it('should coerce string numbers to numbers', () => {
      const input = {
        page: '2',
        pageSize: '20'
      };

      const result = userQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.pageSize).toBe(20);
      }
    });

    it('should validate role filter', () => {
      const input = { role: 'ADMIN' };
      const result = userQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should reject invalid role', () => {
      const input = { role: 'SUPER_ADMIN' };
      const result = userQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });
});
