export type UserRole = 'student' | 'teacher' | 'root_admin';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  activeCourse: string;
  assignedCourses?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserRecord extends UserAccount {
  passwordHash?: string;
  salt?: string;
}

export interface Session {
  token: string;
  userId: string;
  role: UserRole;
  createdAt: string;
  expiresAt: string;
}

export interface AuthResult {
  success: boolean;
  user?: UserAccount;
  sessionToken?: string;
  error?: string;
}

export interface SharedChatSnapshot {
  id: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  messages: Array<{ role: string; text: string }>;
  createdAt: string;
}

// Utility: Convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Utility: Convert hex string to Uint8Array
function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Web Crypto PBKDF2 Password Hashing (compatible with Cloudflare Workers workerd, Node 20+, and browsers)
export async function hashPassword(
  password: string,
  saltHex?: string
): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  let saltBytes: Uint8Array;

  if (saltHex) {
    saltBytes = hexToBuffer(saltHex);
  } else {
    saltBytes = new Uint8Array(16);
    crypto.getRandomValues(saltBytes);
  }

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return {
    hash: bufferToHex(derivedBits),
    salt: bufferToHex(saltBytes.buffer),
  };
}

export async function verifyPassword(
  password: string,
  expectedHash: string,
  salt: string
): Promise<boolean> {
  const { hash } = await hashPassword(password, salt);
  return timingSafeEqual(hash, expectedHash);
}

export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes.buffer);
}

export function generateShareId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes.buffer);
}

export function sanitizeUser(record: UserRecord): UserAccount {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    activeCourse: record.activeCourse,
    assignedCourses: record.assignedCourses,
    isActive: record.isActive,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class InMemoryAuthStore {
  private usersByEmail = new Map<string, UserRecord>();
  private usersById = new Map<string, UserRecord>();
  private sessions = new Map<string, Session>();
  private sharedChats = new Map<string, SharedChatSnapshot>();

  async registerUser(params: {
    name: string;
    email: string;
    password: string;
    activeCourse?: string;
  }): Promise<AuthResult> {
    const normalizedEmail = params.email.trim().toLowerCase();

    if (this.usersByEmail.has(normalizedEmail)) {
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

    const record: UserRecord = {
      id,
      name: params.name.trim(),
      email: normalizedEmail,
      role: 'student',
      activeCourse: params.activeCourse || 'para-no-programadores',
      isActive: true,
      passwordHash: hash,
      salt,
      createdAt: now,
      updatedAt: now,
    };

    this.usersByEmail.set(normalizedEmail, record);
    this.usersById.set(id, record);

    const session = await this.createSession(id, 'student');

    return {
      success: true,
      user: sanitizeUser(record),
      sessionToken: session.token,
    };
  }

  async authenticate(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const record = this.usersByEmail.get(normalizedEmail);

    if (!record) {
      return {
        success: false,
        error: 'Invalid credentials. Please verify email and password.',
      };
    }

    if (!record.isActive) {
      return {
        success: false,
        error: 'Account is deactivated. Please contact administrator.',
      };
    }

    const isValid = await verifyPassword(password, record.passwordHash, record.salt);
    if (!isValid) {
      return {
        success: false,
        error: 'Invalid credentials. Please verify email and password.',
      };
    }

    const session = await this.createSession(record.id, record.role);

    return {
      success: true,
      user: sanitizeUser(record),
      sessionToken: session.token,
    };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    return this.authenticate(email, password);
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
    if (
      normalizedEmail !== rootEmail.trim().toLowerCase() ||
      !timingSafeEqual(password, rootPassword)
    ) {
      return {
        success: false,
        error: 'Invalid root administrator credentials.',
      };
    }

    const rootUser: UserAccount = {
      id: 'root_admin_singleton',
      name: 'Root Administrator',
      email: rootEmail,
      role: 'root_admin',
      activeCourse: 'all',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const session = await this.createSession(rootUser.id, 'root_admin');

    return {
      success: true,
      user: rootUser,
      sessionToken: session.token,
    };
  }

  async getOrCreateDelegatedAdmin(email: string, name?: string): Promise<UserAccount> {
    const normalizedEmail = email.trim().toLowerCase();
    let record = this.usersByEmail.get(normalizedEmail);
    if (!record) {
      const now = new Date().toISOString();
      const id = `adm_${generateSessionToken().substring(0, 12)}`;
      record = {
        id,
        name: name || 'Root Administrator',
        email: normalizedEmail,
        role: 'root_admin',
        activeCourse: 'all',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      this.usersByEmail.set(normalizedEmail, record);
      this.usersById.set(id, record);
    }
    return sanitizeUser(record);
  }

  canAccessBackoffice(user: UserAccount | null): boolean {
    return user !== null && user.role === 'root_admin';
  }

  async createTeacher(params: {
    name: string;
    email: string;
    password: string;
    assignedCourses?: string[];
  }): Promise<AuthResult> {
    const normalizedEmail = params.email.trim().toLowerCase();

    if (this.usersByEmail.has(normalizedEmail)) {
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
    const id = `tea_${generateSessionToken().substring(0, 12)}`;
    const now = new Date().toISOString();

    const record: UserRecord = {
      id,
      name: params.name.trim(),
      email: normalizedEmail,
      role: 'teacher',
      activeCourse: params.assignedCourses?.[0] || 'all',
      assignedCourses: params.assignedCourses && params.assignedCourses.length > 0 ? params.assignedCourses : ['all'],
      isActive: true,
      passwordHash: hash,
      salt,
      createdAt: now,
      updatedAt: now,
    };

    this.usersByEmail.set(normalizedEmail, record);
    this.usersById.set(id, record);

    return {
      success: true,
      user: sanitizeUser(record),
    };
  }

  async listTeachers(): Promise<UserAccount[]> {
    const teachers: UserAccount[] = [];
    for (const record of this.usersById.values()) {
      if (record.role === 'teacher') {
        teachers.push(sanitizeUser(record));
      }
    }
    return teachers;
  }

  async setTeacherStatus(teacherId: string, isActive: boolean): Promise<boolean> {
    const record = this.usersById.get(teacherId);
    if (!record || record.role !== 'teacher') return false;

    record.isActive = isActive;
    record.updatedAt = new Date().toISOString();
    this.usersById.set(teacherId, record);
    this.usersByEmail.set(record.email, record);

    // If deactivated, revoke all active sessions for this teacher
    if (!isActive) {
      for (const [token, session] of this.sessions.entries()) {
        if (session.userId === teacherId) {
          this.sessions.delete(token);
        }
      }
    }

    return true;
  }

  async createSession(userId: string, role: UserRole = 'student'): Promise<Session> {
    const token = generateSessionToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    const session: Session = {
      token,
      userId,
      role,
      createdAt: now.toISOString(),
      expiresAt,
    };

    this.sessions.set(token, session);
    return session;
  }

  async validateSession(token: string): Promise<UserAccount | null> {
    if (!token) return null;
    const session = this.sessions.get(token);
    if (!session) return null;

    if (new Date(session.expiresAt) < new Date()) {
      this.sessions.delete(token);
      return null;
    }

    if (session.userId === 'root_admin_singleton') {
      const rootEmail = process.env.ROOT_ADMIN_EMAIL || 'admin@desde0.dev';
      return {
        id: 'root_admin_singleton',
        name: 'Root Administrator',
        email: rootEmail,
        role: 'root_admin',
        activeCourse: 'all',
        isActive: true,
        createdAt: session.createdAt,
        updatedAt: session.createdAt,
      };
    }

    const userRecord = this.usersById.get(session.userId);
    if (!userRecord || !userRecord.isActive) {
      this.sessions.delete(token);
      return null;
    }

    return sanitizeUser(userRecord);
  }

  async revokeSession(token: string): Promise<boolean> {
    return this.sessions.delete(token);
  }

  async createSharedChat(params: {
    userId: string;
    studentName: string;
    studentEmail: string;
    courseId: string;
    messages: Array<{ role: string; text: string }>;
  }): Promise<SharedChatSnapshot> {
    const id = generateShareId();
    const snapshot: SharedChatSnapshot = {
      id,
      userId: params.userId,
      studentName: params.studentName,
      studentEmail: params.studentEmail,
      courseId: params.courseId,
      messages: params.messages,
      createdAt: new Date().toISOString(),
    };

    this.sharedChats.set(id, snapshot);
    return snapshot;
  }

  async getSharedChat(shareId: string): Promise<SharedChatSnapshot | null> {
    return this.sharedChats.get(shareId) || null;
  }

  clear(): void {
    this.usersByEmail.clear();
    this.usersById.clear();
    this.sessions.clear();
    this.sharedChats.clear();
  }
}

export const defaultAuthStore = new InMemoryAuthStore();

import { D1AuthStore } from './d1/auth';
import { initializeD1Schema, type D1Database } from './d1/db';

const d1AuthStoreCache = new WeakMap<object, D1AuthStore>();

export function getAuthStore(db?: D1Database): InMemoryAuthStore | D1AuthStore {
  if (!db) return defaultAuthStore;
  let store = d1AuthStoreCache.get(db as object);
  if (!store) {
    initializeD1Schema(db);
    store = new D1AuthStore(db);
    d1AuthStoreCache.set(db as object, store);
  }
  return store;
}

export function extractCloudflareAccessEmail(request: Request): string | null {
  const email = request.headers.get('cf-access-authenticated-user-email');
  if (!email || !email.trim()) return null;
  return email.trim().toLowerCase();
}

export function parseAllowedAdminEmails(emailsConfig?: string): string[] {
  if (!emailsConfig) return [];
  return emailsConfig
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export interface DelegatedAuthResult {
  authorized: boolean;
  email?: string;
  user?: UserAccount;
  sessionToken?: string;
  error?: string;
}

export async function authenticateDelegatedAdmin(
  email: string | null | undefined,
  allowedEmailsConfig?: string,
  store: {
    getOrCreateDelegatedAdmin(email: string, name?: string): Promise<UserAccount>;
    createSession(userId: string, role?: UserRole): Promise<Session>;
  } = defaultAuthStore
): Promise<DelegatedAuthResult> {
  if (!email) {
    return {
      authorized: false,
      error: 'No se detectó identidad de Cloudflare Access en la solicitud.',
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const allowedList = parseAllowedAdminEmails(allowedEmailsConfig);

  if (!allowedList.includes(normalizedEmail)) {
    return {
      authorized: false,
      error: `El correo "${normalizedEmail}" no está autorizado para acceder al Backoffice.`,
    };
  }

  const user = await store.getOrCreateDelegatedAdmin(normalizedEmail);
  const session = await store.createSession(user.id, 'root_admin');

  return {
    authorized: true,
    email: user.email,
    user,
    sessionToken: session.token,
  };
}
