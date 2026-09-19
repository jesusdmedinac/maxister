export interface UserAccount {
  id: string;
  name: string;
  email: string;
  activeCourse: string;
  createdAt: string;
  updatedAt: string;
}

interface UserRecord extends UserAccount {
  passwordHash: string;
  salt: string;
}

export interface Session {
  token: string;
  userId: string;
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
    activeCourse: record.activeCourse,
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
      activeCourse: params.activeCourse || 'para-no-programadores',
      passwordHash: hash,
      salt,
      createdAt: now,
      updatedAt: now,
    };

    this.usersByEmail.set(normalizedEmail, record);
    this.usersById.set(id, record);

    const session = await this.createSession(id);

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

    const isValid = await verifyPassword(password, record.passwordHash, record.salt);
    if (!isValid) {
      return {
        success: false,
        error: 'Invalid credentials. Please verify email and password.',
      };
    }

    const session = await this.createSession(record.id);

    return {
      success: true,
      user: sanitizeUser(record),
      sessionToken: session.token,
    };
  }

  async createSession(userId: string): Promise<Session> {
    const token = generateSessionToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    const session: Session = {
      token,
      userId,
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

    const userRecord = this.usersById.get(session.userId);
    if (!userRecord) return null;

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
