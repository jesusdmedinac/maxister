import { describe, it, expect, beforeEach } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  InMemoryAuthStore,
} from '../src/lib/auth';

describe('Feature 6: Student Authentication & Human Teacher Escalation', () => {
  let authStore: InMemoryAuthStore;

  beforeEach(() => {
    authStore = new InMemoryAuthStore();
  });

  describe('Scenario 1: Register a new student account with validation and password hashing', () => {
    it('should register a new student with hashed password and return valid session', async () => {
      const result = await authStore.registerUser({
        name: 'Mariana',
        email: 'mariana@desde0.dev',
        password: 'secur3Pass!',
        activeCourse: 'kotlin-beginners',
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.name).toBe('Mariana');
      expect(result.user?.email).toBe('mariana@desde0.dev');
      expect(result.user?.activeCourse).toBe('kotlin-beginners');
      expect((result.user as any)?.passwordHash).toBeUndefined(); // Password hash must not be leaked
      expect(result.sessionToken).toBeDefined();
      expect(typeof result.sessionToken).toBe('string');
    });

    it('should securely hash password with PBKDF2 and random salt', async () => {
      const { hash: hash1, salt: salt1 } = await hashPassword('myPassword123');
      const { hash: hash2, salt: salt2 } = await hashPassword('myPassword123');

      expect(hash1).toBeDefined();
      expect(salt1).toBeDefined();
      // Different salts must produce different hashes for the same password
      expect(salt1).not.toBe(salt2);
      expect(hash1).not.toBe(hash2);

      const isValid = await verifyPassword('myPassword123', hash1, salt1);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword('wrongPassword', hash1, salt1);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Scenario 2: Prevent duplicate account registration with the same email', () => {
    it('should reject registration if email is already taken (case-insensitive)', async () => {
      await authStore.registerUser({
        name: 'Mariana',
        email: 'mariana@desde0.dev',
        password: 'secur3Pass!',
      });

      const duplicateResult = await authStore.registerUser({
        name: 'Mariana Duplicate',
        email: 'MARIANA@desde0.dev',
        password: 'anotherPassword',
      });

      expect(duplicateResult.success).toBe(false);
      expect(duplicateResult.error).toMatch(/already exists/i);
    });
  });

  describe('Scenario 3: Log in with valid credentials and issue secure session cookie', () => {
    it('should authenticate user and return profile with new session token', async () => {
      await authStore.registerUser({
        name: 'Mariana',
        email: 'mariana@desde0.dev',
        password: 'secur3Pass!',
        activeCourse: 'kotlin-beginners',
      });

      const loginResult = await authStore.authenticate('mariana@desde0.dev', 'secur3Pass!');

      expect(loginResult.success).toBe(true);
      expect(loginResult.user?.name).toBe('Mariana');
      expect(loginResult.user?.email).toBe('mariana@desde0.dev');
      expect(loginResult.sessionToken).toBeDefined();
    });
  });

  describe('Scenario 4: Reject login with invalid email or incorrect password', () => {
    it('should fail with invalid credentials on wrong password', async () => {
      await authStore.registerUser({
        name: 'Mariana',
        email: 'mariana@desde0.dev',
        password: 'secur3Pass!',
      });

      const result = await authStore.authenticate('mariana@desde0.dev', 'wrongPassword');

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/invalid credentials/i);
    });

    it('should fail with invalid credentials on non-existent email', async () => {
      const result = await authStore.authenticate('unknown@desde0.dev', 'anyPassword');

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/invalid credentials/i);
    });
  });

  describe('Scenario 5: Inspect session state and log out terminating session', () => {
    it('should validate an active session and invalidate it upon logout', async () => {
      const reg = await authStore.registerUser({
        name: 'Mariana',
        email: 'mariana@desde0.dev',
        password: 'secur3Pass!',
      });

      const token = reg.sessionToken!;
      const userProfile = await authStore.validateSession(token);

      expect(userProfile).not.toBeNull();
      expect(userProfile?.email).toBe('mariana@desde0.dev');

      // Logout / revoke
      const revoked = await authStore.revokeSession(token);
      expect(revoked).toBe(true);

      const profileAfterLogout = await authStore.validateSession(token);
      expect(profileAfterLogout).toBeNull();
    });
  });

  describe('Scenario 6: Authenticated student creates a shared chat snapshot for the teacher', () => {
    it('should create an immutable shared chat snapshot with student context and messages', async () => {
      const reg = await authStore.registerUser({
        name: 'Mariana',
        email: 'mariana@desde0.dev',
        password: 'secur3Pass!',
        activeCourse: 'kotlin-beginners',
      });

      const messages = [
        { role: 'user', text: '¿Cómo funciona un bucle while en Kotlin?' },
        { role: 'model', text: 'Un bucle while evalúa una condición antes de ejecutar el bloque.' },
        { role: 'user', text: 'Me da un bucle infinito en este código...' },
        { role: 'model', text: 'Revisa si estás incrementando tu contador dentro del bucle.' },
      ];

      const snapshot = await authStore.createSharedChat({
        userId: reg.user!.id,
        studentName: reg.user!.name,
        studentEmail: reg.user!.email,
        courseId: reg.user!.activeCourse,
        messages,
      });

      expect(snapshot).toBeDefined();
      expect(snapshot.id).toBeDefined();
      expect(snapshot.studentName).toBe('Mariana');
      expect(snapshot.studentEmail).toBe('mariana@desde0.dev');
      expect(snapshot.courseId).toBe('kotlin-beginners');
      expect(snapshot.messages.length).toBe(4);
      expect(snapshot.createdAt).toBeDefined();
    });
  });

  describe('Scenario 7: Human teacher accesses and inspects a shared student chat via unique link', () => {
    it('should retrieve the complete shared chat snapshot by ID', async () => {
      const reg = await authStore.registerUser({
        name: 'Mariana',
        email: 'mariana@desde0.dev',
        password: 'secur3Pass!',
        activeCourse: 'kotlin-beginners',
      });

      const messages = [
        { role: 'user', text: 'Necesito ayuda con la lección 3' },
        { role: 'model', text: '¿Qué parte de las funciones te genera dudas?' },
      ];

      const created = await authStore.createSharedChat({
        userId: reg.user!.id,
        studentName: reg.user!.name,
        studentEmail: reg.user!.email,
        courseId: reg.user!.activeCourse,
        messages,
      });

      const retrieved = await authStore.getSharedChat(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.studentName).toBe('Mariana');
      expect(retrieved?.courseId).toBe('kotlin-beginners');
      expect(retrieved?.messages[0].text).toBe('Necesito ayuda con la lección 3');

      const nonExistent = await authStore.getSharedChat('non-existent-id');
      expect(nonExistent).toBeNull();
    });
  });
});
