import { validatePassword, passwordSchema } from '../enhanced-validation';

describe('Enhanced Validation', () => {
    describe('validatePassword', () => {
        it('should accept strong passwords', () => {
            const result = validatePassword('MyP@ssw0rd123!');
            expect(result.valid).toBe(true);
            expect(result.strength).toBe('strong');
        });

        it('should reject short passwords', () => {
            const result = validatePassword('Short1!');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must be at least 12 characters');
        });

        it('should reject passwords without uppercase', () => {
            const result = validatePassword('myp@ssw0rd123!');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
        });

        it('should reject passwords without lowercase', () => {
            const result = validatePassword('MYP@SSW0RD123!');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one lowercase letter');
        });

        it('should reject passwords without numbers', () => {
            const result = validatePassword('MyP@ssword!!!');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one number');
        });

        it('should reject passwords without special characters', () => {
            const result = validatePassword('MyPassword123');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one special character');
        });

        it('should reject common passwords', () => {
            const result = validatePassword('Password123!');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password is too common');
        });

        it('should reject passwords with repeated characters', () => {
            const result = validatePassword('MyP@ssw0rd111!!!');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password contains too many repeated characters');
        });

        it('should reject passwords with sequential characters', () => {
            const result = validatePassword('MyP@ssw0rd123abc!');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password contains sequential characters');
        });

        it('should calculate password strength correctly', () => {
            const weak = validatePassword('MyP@ssw0rd12');
            expect(weak.strength).toBe('medium');

            const strong = validatePassword('MyP@ssw0rd123!@#');
            expect(strong.strength).toBe('strong');
        });
    });

    describe('passwordSchema', () => {
        it('should validate with Zod schema', () => {
            const result = passwordSchema.safeParse('MyP@ssw0rd123!');
            expect(result.success).toBe(true);
        });

        it('should reject invalid passwords with Zod', () => {
            const result = passwordSchema.safeParse('short');
            expect(result.success).toBe(false);
        });
    });
});
