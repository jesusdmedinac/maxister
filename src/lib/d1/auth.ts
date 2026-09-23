import type { D1Database } from './db';
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  generateShareId,
  type UserAccount,
  type UserRole,
  type Session,
  type AuthResult,
  type SharedChatSnapshot,
} from '../auth';

export class D1AuthStore {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async registerUser(params: {
    name: string;
    email: string;
    password: string;
    activeCourse?: string;
  }): Promise<AuthResult> {
    const normalizedEmail = params.email.trim().toLowerCase();

    // Check existing
    const existing = await this.db
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(normalizedEmail)
      .first<{ id: string }>();

    if (existing) {
      return {
        success: false,
        error: 'An account with this email already exists.',
      };
    }

    if (!params.password || params.password.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters long.',
      };
    }

    const { hash, salt } = await hashPassword(params.password);
    const id = `std_${generateSessionToken().substring(0, 12)}`;
    const now = new Date().toISOString();
    const activeCourse = params.activeCourse || 'para-no-programadores';

    await this.db
      .prepare(
        `INSERT INTO users (id, email, password_hash, salt, name, role, active_course, assigned_courses, auth_provider, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'student', ?, '[]', 'credentials', 1, ?, ?)`
      )
      .bind(id, normalizedEmail, hash, salt, params.name.trim(), activeCourse, now, now)
      .run();

    const session = await this.createSession(id, 'student');

    const user: UserAccount = {
      id,
      name: params.name.trim(),
      email: normalizedEmail,
      role: 'student',
      activeCourse,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    return {
      success: true,
      user,
      sessionToken: session.token,
    };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();

    const record = await this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(normalizedEmail)
      .first<any>();

    if (!record || !record.is_active) {
      return {
        success: false,
        error: 'Invalid email or password.',
      };
    }

    if (!record.password_hash || !record.salt) {
      return {
        success: false,
        error: 'Esta cuenta utiliza autenticación delegada por SSO/Zero Trust. Inicie sesión a través de su proveedor.',
      };
    }

    const isValid = await verifyPassword(password, record.password_hash, record.salt);
    if (!isValid) {
      return {
        success: false,
        error: 'Invalid email or password.',
      };
    }

    const session = await this.createSession(record.id, record.role as UserRole);

    return {
      success: true,
      user: this.mapUser(record),
      sessionToken: session.token,
    };
  }

  async createTeacher(params: {
    name: string;
    email: string;
    password: string;
    assignedCourses?: string[];
  }): Promise<AuthResult> {
    const normalizedEmail = params.email.trim().toLowerCase();

    const existing = await this.db
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(normalizedEmail)
      .first<{ id: string }>();

    if (existing) {
      return {
        success: false,
        error: 'A user with this email already exists.',
      };
    }

    if (!params.password || params.password.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters long.',
      };
    }

    const { hash, salt } = await hashPassword(params.password);
    const id = `tea_${generateSessionToken().substring(0, 12)}`;
    const now = new Date().toISOString();
    const assignedJson = JSON.stringify(params.assignedCourses || []);

    await this.db
      .prepare(
        `INSERT INTO users (id, email, password_hash, salt, name, role, active_course, assigned_courses, auth_provider, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'teacher', 'all', ?, 'credentials', 1, ?, ?)`
      )
      .bind(id, normalizedEmail, hash, salt, params.name.trim(), assignedJson, now, now)
      .run();

    const session = await this.createSession(id, 'teacher');

    const user: UserAccount = {
      id,
      name: params.name.trim(),
      email: normalizedEmail,
      role: 'teacher',
      activeCourse: 'all',
      assignedCourses: params.assignedCourses || [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    return {
      success: true,
      user,
      sessionToken: session.token,
    };
  }

  async listTeachers(): Promise<UserAccount[]> {
    const res = await this.db
      .prepare("SELECT * FROM users WHERE role = 'teacher' ORDER BY created_at DESC")
      .all<any>();

    return res.results.map((r) => this.mapUser(r));
  }

  async setTeacherActive(teacherId: string, isActive: boolean): Promise<boolean> {
    const now = new Date().toISOString();
    const res = await this.db
      .prepare("UPDATE users SET is_active = ?, updated_at = ? WHERE id = ? AND role = 'teacher'")
      .bind(isActive ? 1 : 0, now, teacherId)
      .run();

    if (res.meta?.changes === 0) return false;

    if (!isActive) {
      await this.db
        .prepare('DELETE FROM sessions WHERE user_id = ?')
        .bind(teacherId)
        .run();
    }

    return true;
  }

  async getOrCreateDelegatedAdmin(email: string, name?: string): Promise<UserAccount> {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(normalizedEmail)
      .first<any>();

    if (existing) {
      return this.mapUser(existing);
    }

    const id = `adm_${generateSessionToken().substring(0, 12)}`;
    const now = new Date().toISOString();
    const adminName = name || 'Root Administrator';

    await this.db
      .prepare(
        `INSERT INTO users (id, email, password_hash, salt, name, role, active_course, assigned_courses, auth_provider, is_active, created_at, updated_at)
         VALUES (?, ?, NULL, NULL, ?, 'root_admin', 'all', '[]', 'cloudflare_access', 1, ?, ?)`
      )
      .bind(id, normalizedEmail, adminName, now, now)
      .run();

    return {
      id,
      name: adminName,
      email: normalizedEmail,
      role: 'root_admin',
      activeCourse: 'all',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
  }

  async authenticateRootAdmin(
    email: string,
    password: string,
    envOverrides?: { rootEmail?: string; rootPassword?: string }
  ): Promise<AuthResult> {
    const rootEmail = envOverrides?.rootEmail || process.env.ROOT_ADMIN_EMAIL || '';
    const rootPassword = envOverrides?.rootPassword || process.env.ROOT_ADMIN_PASSWORD || '';

    if (!rootEmail || !rootPassword) {
      return {
        success: false,
        error: 'Root administrator is not configured on this environment.',
      };
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== rootEmail.trim().toLowerCase() || password !== rootPassword) {
      return {
        success: false,
        error: 'Invalid root administrator credentials.',
      };
    }

    const user = await this.getOrCreateDelegatedAdmin(rootEmail, 'Root Administrator');
    const session = await this.createSession(user.id, 'root_admin');

    return {
      success: true,
      user,
      sessionToken: session.token,
    };
  }

  async createSession(userId: string, role: UserRole = 'student'): Promise<Session> {
    const token = generateSessionToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await this.db
      .prepare(
        `INSERT INTO sessions (token, user_id, role, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(token, userId, role, expiresAt, now.toISOString())
      .run();

    return {
      token,
      userId,
      role,
      createdAt: now.toISOString(),
      expiresAt,
    };
  }

  async validateSession(token: string): Promise<UserAccount | null> {
    if (!token) return null;

    const row = await this.db
      .prepare(
        `SELECT u.*, s.expires_at as session_expires_at
         FROM sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.token = ?`
      )
      .bind(token)
      .first<any>();

    if (!row) return null;

    if (new Date(row.session_expires_at) < new Date()) {
      await this.revokeSession(token);
      return null;
    }

    if (!row.is_active) {
      await this.revokeSession(token);
      return null;
    }

    return this.mapUser(row);
  }

  async revokeSession(token: string): Promise<boolean> {
    const res = await this.db
      .prepare('DELETE FROM sessions WHERE token = ?')
      .bind(token)
      .run();
    return (res.meta?.changes ?? 0) > 0;
  }

  async createSharedChat(params: {
    userId: string;
    studentName: string;
    studentEmail: string;
    courseId: string;
    messages: Array<{ role: string; text: string }>;
  }): Promise<SharedChatSnapshot> {
    const id = generateShareId();
    const now = new Date().toISOString();

    // In D1, we can create or ensure thread exists with is_shared = 1
    const threadId = `thr_${id}`;
    await this.db
      .prepare(
        `INSERT OR REPLACE INTO threads (id, user_id, title, course_id, is_shared, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, ?)`
      )
      .bind(threadId, params.userId, `Shared Chat by ${params.studentName}`, params.courseId, now, now)
      .run();

    for (const msg of params.messages) {
      const msgId = `msg_${generateSessionToken().substring(0, 10)}`;
      await this.db
        .prepare(
          `INSERT INTO messages (id, thread_id, sender_id, sender_name, sender_role, text, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          msgId,
          threadId,
          msg.role === 'assistant' ? 'maxister_ai' : params.userId,
          msg.role === 'assistant' ? 'Maxister' : params.studentName,
          msg.role === 'assistant' ? 'assistant' : 'student',
          msg.text,
          now
        )
        .run();
    }

    return {
      id,
      userId: params.userId,
      studentName: params.studentName,
      studentEmail: params.studentEmail,
      courseId: params.courseId,
      messages: params.messages,
      createdAt: now,
    };
  }

  async getSharedChat(shareId: string): Promise<SharedChatSnapshot | null> {
    const threadId = `thr_${shareId}`;
    const thread = await this.db
      .prepare('SELECT * FROM threads WHERE id = ? AND is_shared = 1')
      .bind(threadId)
      .first<any>();

    if (!thread) return null;

    const user = await this.db
      .prepare('SELECT name, email FROM users WHERE id = ?')
      .bind(thread.user_id)
      .first<any>();

    const msgRows = await this.db
      .prepare('SELECT sender_role, text FROM messages WHERE thread_id = ? ORDER BY created_at ASC')
      .bind(threadId)
      .all<any>();

    return {
      id: shareId,
      userId: thread.user_id,
      studentName: user?.name || 'Student',
      studentEmail: user?.email || '',
      courseId: thread.course_id,
      messages: msgRows.results.map((m) => ({
        role: m.sender_role === 'assistant' ? 'assistant' : 'user',
        text: m.text,
      })),
      createdAt: thread.created_at,
    };
  }

  canAccessBackoffice(user: UserAccount | null): boolean {
    return user !== null && user.role === 'root_admin';
  }

  private mapUser(row: any): UserAccount {
    let assignedCourses: string[] | undefined;
    if (row.assigned_courses) {
      try {
        assignedCourses = JSON.parse(row.assigned_courses);
      } catch {
        assignedCourses = [];
      }
    }

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role as UserRole,
      activeCourse: row.active_course,
      assignedCourses,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
