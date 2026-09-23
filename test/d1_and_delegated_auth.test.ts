import { describe, it, expect, beforeEach } from 'vitest';
import { createMockD1, D1Database } from './mock_d1';
import { initializeD1Schema } from '../src/lib/d1/db';
import {
  extractCloudflareAccessEmail,
  authenticateDelegatedAdmin,
  parseAllowedAdminEmails,
} from '../src/lib/auth';
import { D1AuthStore } from '../src/lib/d1/auth';

describe('Feature 14: Cloudflare D1 Relational Persistence & Delegated Authentication', () => {
  let db: D1Database;

  beforeEach(() => {
    db = createMockD1();
  });

  describe('Scenario 1: Initial D1 schema creation and table initialization', () => {
    it('should create all 6 tables and verify their structure', async () => {
      await initializeD1Schema(db);

      // Verify all tables exist in sqlite_master
      const res = await db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        .all<{ name: string }>();

      const tableNames = res.results.map((r) => r.name);
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('sessions');
      expect(tableNames).toContain('threads');
      expect(tableNames).toContain('messages');
      expect(tableNames).toContain('teacher_feedback');
      expect(tableNames).toContain('student_profiles');
    });
  });

  describe('Scenario 2: Delegated Root Admin authentication via Cloudflare Access headers without plain-text passwords', () => {
    it('should authenticate allowed admin via Cloudflare Access header and issue root_admin session', async () => {
      const allowedEmails = 'admin@desde0.dev,jesusdmedinac@gmail.com';
      const request = new Request('http://localhost:4321/backoffice', {
        headers: {
          'cf-access-authenticated-user-email': 'jesusdmedinac@gmail.com',
        },
      });

      const extractedEmail = extractCloudflareAccessEmail(request);
      expect(extractedEmail).toBe('jesusdmedinac@gmail.com');

      const result = await authenticateDelegatedAdmin(extractedEmail, allowedEmails);
      expect(result.authorized).toBe(true);
      expect(result.user?.role).toBe('root_admin');
      expect(result.user?.email).toBe('jesusdmedinac@gmail.com');
      expect(result.sessionToken).toBeDefined();
    });
  });

  describe('Scenario 3: Unauthorized email rejected for Delegated Root Admin access', () => {
    it('should reject unlisted email with unauthorized error and issue no session', async () => {
      const allowedEmails = 'admin@desde0.dev,jesusdmedinac@gmail.com';
      const request = new Request('http://localhost:4321/backoffice', {
        headers: {
          'cf-access-authenticated-user-email': 'intruder@external.com',
        },
      });

      const extractedEmail = extractCloudflareAccessEmail(request);
      expect(extractedEmail).toBe('intruder@external.com');

      const result = await authenticateDelegatedAdmin(extractedEmail, allowedEmails);
      expect(result.authorized).toBe(false);
      expect(result.error).toMatch(/no est[aá] autorizado/i);
      expect(result.sessionToken).toBeUndefined();
    });

    it('should reject request missing Cloudflare Access header', async () => {
      const allowedEmails = 'admin@desde0.dev,jesusdmedinac@gmail.com';
      const request = new Request('http://localhost:4321/backoffice');

      const extractedEmail = extractCloudflareAccessEmail(request);
      expect(extractedEmail).toBeNull();

      const result = await authenticateDelegatedAdmin(extractedEmail, allowedEmails);
      expect(result.authorized).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Scenario 4: User registration, PBKDF2 hashing, and session persistence in D1', () => {
    it('should register student, persist in users and sessions tables, and validate session in D1', async () => {
      await initializeD1Schema(db);
      const authStore = new D1AuthStore(db);

      const regResult = await authStore.registerUser({
        name: 'Carlos Estudiante',
        email: 'student1@desde0.dev',
        password: 'StudentPass123!',
        activeCourse: 'para-no-programadores',
      });

      expect(regResult.success).toBe(true);
      expect(regResult.user).toBeDefined();
      expect(regResult.user?.email).toBe('student1@desde0.dev');
      expect(regResult.sessionToken).toBeDefined();

      // Verify row in SQLite table users
      const userRow = await db
        .prepare('SELECT * FROM users WHERE email = ?')
        .bind('student1@desde0.dev')
        .first<any>();

      expect(userRow).toBeDefined();
      expect(userRow.name).toBe('Carlos Estudiante');
      expect(userRow.password_hash).toBeDefined();
      expect(userRow.salt).toBeDefined();
      expect(userRow.password_hash).not.toBe('StudentPass123!');

      // Verify row in SQLite table sessions
      const sessionRow = await db
        .prepare('SELECT * FROM sessions WHERE token = ?')
        .bind(regResult.sessionToken!)
        .first<any>();

      expect(sessionRow).toBeDefined();
      expect(sessionRow.user_id).toBe(userRow.id);

      // Validate session via authStore
      const validated = await authStore.validateSession(regResult.sessionToken!);
      expect(validated).toBeDefined();
      expect(validated?.id).toBe(userRow.id);
      expect(validated?.name).toBe('Carlos Estudiante');

      // Login with valid credentials
      const loginResult = await authStore.login('student1@desde0.dev', 'StudentPass123!');
      expect(loginResult.success).toBe(true);
      expect(loginResult.sessionToken).toBeDefined();

      // Login with invalid password
      const badLogin = await authStore.login('student1@desde0.dev', 'wrongPass');
      expect(badLogin.success).toBe(false);

      // Revoke session
      const revoked = await authStore.revokeSession(regResult.sessionToken!);
      expect(revoked).toBe(true);
      const revalidated = await authStore.validateSession(regResult.sessionToken!);
      expect(revalidated).toBeNull();
    });
  });
});
