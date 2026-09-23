export type AiParticipationMode = 'off' | 'auto' | 'on';

export interface ConversationThread {
  id: string;
  userId: string;
  title: string;
  courseId: string;
  isShared: boolean;
  assignedTeacherId?: string | null;
  assignedTeacherName?: string | null;
  participatingTeacherIds?: string[];
  aiMode: AiParticipationMode;
  createdAt: string;
  updatedAt: string;
}


export interface RoomMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'teacher' | 'assistant';
  text: string;
  feedbackDirective?: {
    id: string;
    title: string;
    directiveContent: string;
  };
  createdAt: string;
}

export type DirectiveType =
  | 'pedagogical_tip'
  | 'code_correction'
  | 'recommended_analogy'
  | 'forbidden_anti_pattern';

export type FeedbackStatus = 'active' | 'under_review' | 'blocked' | 'archived';

export interface TeacherFeedbackEntry {
  id: string;
  messageId?: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  courseId: string;
  topicTags: string[];
  directiveType: DirectiveType;
  title: string;
  directiveContent: string;
  originalTeacherMessage: string;
  status: FeedbackStatus;
  qualityScore?: number; // 1 to 5
  adminReviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

function generateId(prefix: string): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${prefix}_${hex}`;
}

export class InMemoryConversationStore {
  private threads = new Map<string, ConversationThread>();
  private messagesByThread = new Map<string, RoomMessage[]>();
  private feedbackEntries = new Map<string, TeacherFeedbackEntry>();

  async createThread(
    userId: string,
    title: string = 'Nueva Conversación',
    courseId: string = 'para-no-programadores'
  ): Promise<ConversationThread> {
    const id = generateId('thr');
    const now = new Date().toISOString();

    const thread: ConversationThread = {
      id,
      userId,
      title: title.trim(),
      courseId,
      isShared: false,
      assignedTeacherId: null,
      assignedTeacherName: null,
      participatingTeacherIds: [],
      aiMode: 'on', // Mandatory AI On for personal student chat
      createdAt: now,
      updatedAt: now,
    };

    this.threads.set(id, thread);
    this.messagesByThread.set(id, []);
    return thread;
  }

  async listUserThreads(userId: string): Promise<ConversationThread[]> {
    const userThreads: ConversationThread[] = [];
    for (const thread of this.threads.values()) {
      if (
        thread.userId === userId ||
        (thread.participatingTeacherIds && thread.participatingTeacherIds.includes(userId))
      ) {
        userThreads.push(thread);
      }
    }
    return userThreads.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async listSharedThreads(): Promise<ConversationThread[]> {
    const shared: ConversationThread[] = [];
    for (const thread of this.threads.values()) {
      if (thread.isShared) {
        shared.push(thread);
      }
    }
    return shared.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getThread(threadId: string): Promise<ConversationThread | null> {
    return this.threads.get(threadId) || null;
  }

  async shareThread(threadId: string): Promise<ConversationThread | null> {
    const thread = this.threads.get(threadId);
    if (!thread) return null;

    thread.isShared = true;
    thread.aiMode = 'auto'; // Defaults automatically to AI Auto upon sharing
    thread.updatedAt = new Date().toISOString();
    this.threads.set(threadId, thread);
    return thread;
  }

  async claimThreadByTeacher(
    threadId: string,
    teacherId: string,
    teacherName: string
  ): Promise<{ success: boolean; thread?: ConversationThread; error?: string }> {
    const thread = this.threads.get(threadId);
    if (!thread) {
      return { success: false, error: 'Consulta no encontrada' };
    }

    if (thread.assignedTeacherId && thread.assignedTeacherId !== teacherId) {
      return {
        success: false,
        error: `Esta consulta ya está siendo atendida por el profesor ${thread.assignedTeacherName || 'asignado'}.`,
      };
    }

    thread.assignedTeacherId = teacherId;
    thread.assignedTeacherName = teacherName;

    if (!thread.participatingTeacherIds) {
      thread.participatingTeacherIds = [];
    }
    if (!thread.participatingTeacherIds.includes(teacherId)) {
      thread.participatingTeacherIds.push(teacherId);
    }

    thread.updatedAt = new Date().toISOString();
    this.threads.set(threadId, thread);

    return { success: true, thread };
  }


  async releaseThreadByTeacher(
    threadId: string,
    teacherId: string
  ): Promise<{ success: boolean; thread?: ConversationThread; error?: string }> {
    const thread = this.threads.get(threadId);
    if (!thread) {
      return { success: false, error: 'Consulta no encontrada' };
    }

    if (thread.assignedTeacherId && thread.assignedTeacherId !== teacherId) {
      return {
        success: false,
        error: 'No puedes liberar una consulta asignada a otro profesor.',
      };
    }

    thread.assignedTeacherId = null;
    thread.assignedTeacherName = null;
    thread.updatedAt = new Date().toISOString();
    this.threads.set(threadId, thread);

    return { success: true, thread };
  }

  async setAiMode(
    threadId: string,
    mode: AiParticipationMode
  ): Promise<ConversationThread | null> {
    const thread = this.threads.get(threadId);
    if (!thread) return null;

    thread.aiMode = mode;
    thread.updatedAt = new Date().toISOString();
    this.threads.set(threadId, thread);
    return thread;
  }

  async addMessage(
    threadId: string,
    message: Omit<RoomMessage, 'id' | 'threadId' | 'createdAt'>
  ): Promise<RoomMessage> {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    const id = generateId('msg');
    const now = new Date().toISOString();

    const roomMessage: RoomMessage = {
      id,
      threadId,
      senderId: message.senderId,
      senderName: message.senderName,
      senderRole: message.senderRole,
      text: message.text,
      feedbackDirective: message.feedbackDirective,
      createdAt: now,
    };

    const messages = this.messagesByThread.get(threadId) || [];
    messages.push(roomMessage);
    this.messagesByThread.set(threadId, messages);

    thread.updatedAt = now;
    this.threads.set(threadId, thread);

    return roomMessage;
  }

  async getMessages(threadId: string, since?: string): Promise<RoomMessage[]> {
    const messages = this.messagesByThread.get(threadId) || [];
    if (!since) return messages;

    const sinceDate = new Date(since).getTime();
    return messages.filter((m) => new Date(m.createdAt).getTime() > sinceDate);
  }

  async importMessages(
    threadId: string,
    messages: { role: string; text: string; senderRole?: string; senderName?: string; senderId?: string }[],
    studentInfo?: { id: string; name: string }
  ): Promise<RoomMessage[]> {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    const existing = this.messagesByThread.get(threadId) || [];
    const existingKeys = new Set(existing.map((m) => `${m.senderRole}:${m.text.trim()}`));

    const baseTime = Date.now() - (messages.length + 1) * 1000;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg.text || !msg.text.trim()) continue;

      const isBot = msg.role === 'model' || msg.role === 'assistant' || msg.senderRole === 'assistant';
      const senderRole: 'student' | 'teacher' | 'assistant' = isBot
        ? 'assistant'
        : (msg.senderRole as any) || 'student';
      const senderName = isBot
        ? 'Maxister'
        : msg.senderName || studentInfo?.name || 'Estudiante';
      const senderId = isBot
        ? 'maxister_ai'
        : msg.senderId || studentInfo?.id || thread.userId;

      const key = `${senderRole}:${msg.text.trim()}`;
      if (existingKeys.has(key)) {
        continue;
      }

      const id = generateId('msg');
      const createdAt = new Date(baseTime + (existing.length + i) * 1000).toISOString();

      const roomMsg: RoomMessage = {
        id,
        threadId,
        senderId,
        senderName,
        senderRole,
        text: msg.text.trim(),
        createdAt,
      };

      existing.push(roomMsg);
      existingKeys.add(key);
    }

    this.messagesByThread.set(threadId, existing);
    thread.updatedAt = new Date().toISOString();
    this.threads.set(threadId, thread);

    return existing;
  }

  async addTeacherFeedback(
    entry: Omit<TeacherFeedbackEntry, 'id' | 'status' | 'createdAt' | 'updatedAt'> & {
      status?: FeedbackStatus;
    }
  ): Promise<TeacherFeedbackEntry> {
    const id = generateId('tfb');
    const now = new Date().toISOString();

    const record: TeacherFeedbackEntry = {
      id,
      messageId: entry.messageId,
      teacherId: entry.teacherId,
      teacherName: entry.teacherName,
      studentId: entry.studentId,
      studentName: entry.studentName,
      courseId: entry.courseId,
      topicTags: entry.topicTags || [],
      directiveType: entry.directiveType,
      title: entry.title,
      directiveContent: entry.directiveContent,
      originalTeacherMessage: entry.originalTeacherMessage,
      status: entry.status || 'active',
      qualityScore: entry.qualityScore,
      adminReviewNotes: entry.adminReviewNotes,
      createdAt: now,
      updatedAt: now,
    };

    this.feedbackEntries.set(id, record);
    return record;
  }

  async updateTeacherFeedback(
    id: string,
    update: Partial<Pick<TeacherFeedbackEntry, 'status' | 'qualityScore' | 'adminReviewNotes' | 'title' | 'directiveContent'>>
  ): Promise<TeacherFeedbackEntry | null> {
    const entry = this.feedbackEntries.get(id);
    if (!entry) return null;

    if (update.status) entry.status = update.status;
    if (update.qualityScore !== undefined) entry.qualityScore = update.qualityScore;
    if (update.adminReviewNotes !== undefined) entry.adminReviewNotes = update.adminReviewNotes;
    if (update.title) entry.title = update.title;
    if (update.directiveContent) entry.directiveContent = update.directiveContent;

    entry.updatedAt = new Date().toISOString();
    this.feedbackEntries.set(id, entry);
    return entry;
  }

  async deleteTeacherFeedback(id: string): Promise<boolean> {
    return this.feedbackEntries.delete(id);
  }

  async listTeacherFeedback(filters?: {
    courseId?: string;
    teacherId?: string;
    status?: FeedbackStatus;
  }): Promise<TeacherFeedbackEntry[]> {
    let list = Array.from(this.feedbackEntries.values());

    if (filters?.courseId) {
      list = list.filter((e) => e.courseId === filters.courseId);
    }
    if (filters?.teacherId) {
      list = list.filter((e) => e.teacherId === filters.teacherId);
    }
    if (filters?.status) {
      list = list.filter((e) => e.status === filters.status);
    }

    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getStrategicFeedback(
    courseId: string,
    topicQuery?: string
  ): Promise<TeacherFeedbackEntry[]> {
    let list = Array.from(this.feedbackEntries.values()).filter(
      (e) => e.status === 'active' && (e.courseId === courseId || e.courseId === 'all')
    );

    if (topicQuery) {
      const q = topicQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.directiveContent.toLowerCase().includes(q) ||
          e.topicTags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return list;
  }

  clear(): void {
    this.threads.clear();
    this.messagesByThread.clear();
    this.feedbackEntries.clear();
  }
}

export const defaultConversationStore = new InMemoryConversationStore();

import { D1ConversationStore } from './d1/conversations';
import { initializeD1Schema, type D1Database } from './d1/db';

const d1ConvStoreCache = new WeakMap<object, D1ConversationStore>();

export function getConversationStore(db?: D1Database): InMemoryConversationStore | D1ConversationStore {
  if (!db) return defaultConversationStore;
  let store = d1ConvStoreCache.get(db as object);
  if (!store) {
    initializeD1Schema(db);
    store = new D1ConversationStore(db);
    d1ConvStoreCache.set(db as object, store);
  }
  return store;
}
