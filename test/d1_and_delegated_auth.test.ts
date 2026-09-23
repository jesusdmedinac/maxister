import { describe, it, expect, beforeEach } from 'vitest';
import { createMockD1, D1Database } from './mock_d1';
import { initializeD1Schema } from '../src/lib/d1/db';

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
});
