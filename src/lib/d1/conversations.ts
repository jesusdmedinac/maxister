import type { D1Database } from './db';
import type {
  AiParticipationMode,
  ConversationThread,
  RoomMessage,
  TeacherFeedbackEntry,
  FeedbackStatus,
  DirectiveType,
} from '../conversations';

function generateId(prefix: string): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${prefix}_${hex}`;
}

export class D1ConversationStore {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async createThread(
    userId: string,
    title: string = 'Nueva Conversación',
    courseId: string = 'para-no-programadores'
  ): Promise<ConversationThread> {
    const id = generateId('thr');
    const now = new Date().toISOString();

    await this.db
      .prepare(
        `INSERT INTO threads (id, user_id, title, course_id, is_shared, assigned_teacher_id, assigned_teacher_name, participating_teacher_ids, ai_mode, created_at, updated_at)
         VALUES (?, ?, ?, ?, 0, NULL, NULL, '[]', 'on', ?, ?)`
      )
      .bind(id, userId, title.trim(), courseId, now, now)
      .run();

    return {
      id,
      userId,
      title: title.trim(),
      courseId,
      isShared: false,
      assignedTeacherId: null,
      assignedTeacherName: null,
      participatingTeacherIds: [],
      aiMode: 'on',
      createdAt: now,
      updatedAt: now,
    };
  }

  async listUserThreads(userId: string): Promise<ConversationThread[]> {
    const res = await this.db
      .prepare(
        `SELECT * FROM threads
         WHERE user_id = ? OR participating_teacher_ids LIKE ?
         ORDER BY updated_at DESC`
      )
      .bind(userId, `%${userId}%`)
      .all<any>();

    return res.results.map((r) => this.mapThread(r));
  }

  async listSharedThreads(): Promise<ConversationThread[]> {
    const res = await this.db
      .prepare('SELECT * FROM threads WHERE is_shared = 1 ORDER BY updated_at DESC')
      .all<any>();

    return res.results.map((r) => this.mapThread(r));
  }

  async getThread(threadId: string): Promise<ConversationThread | null> {
    const row = await this.db
      .prepare('SELECT * FROM threads WHERE id = ?')
      .bind(threadId)
      .first<any>();

    if (!row) return null;
    return this.mapThread(row);
  }

  async shareThread(threadId: string): Promise<ConversationThread | null> {
    const now = new Date().toISOString();
    const res = await this.db
      .prepare(
        `UPDATE threads
         SET is_shared = 1, ai_mode = 'auto', updated_at = ?
         WHERE id = ?`
      )
      .bind(now, threadId)
      .run();

    if ((res.meta?.changes ?? 0) === 0) return null;
    return this.getThread(threadId);
  }

  async claimThreadByTeacher(
    threadId: string,
    teacherId: string,
    teacherName: string
  ): Promise<{ success: boolean; thread?: ConversationThread; error?: string }> {
    const thread = await this.getThread(threadId);
    if (!thread) {
      return { success: false, error: 'Consulta no encontrada' };
    }

    if (thread.assignedTeacherId && thread.assignedTeacherId !== teacherId) {
      return {
        success: false,
        error: `Esta consulta ya está siendo atendida por el profesor ${thread.assignedTeacherName || 'asignado'}.`,
      };
    }

    const participating = thread.participatingTeacherIds || [];
    if (!participating.includes(teacherId)) {
      participating.push(teacherId);
    }

    const now = new Date().toISOString();
    await this.db
      .prepare(
        `UPDATE threads
         SET assigned_teacher_id = ?, assigned_teacher_name = ?, participating_teacher_ids = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(teacherId, teacherName, JSON.stringify(participating), now, threadId)
      .run();

    const updated = await this.getThread(threadId);
    return { success: true, thread: updated! };
  }

  async releaseThreadByTeacher(
    threadId: string,
    teacherId: string
  ): Promise<{ success: boolean; thread?: ConversationThread; error?: string }> {
    const thread = await this.getThread(threadId);
    if (!thread) {
      return { success: false, error: 'Consulta no encontrada' };
    }

    if (thread.assignedTeacherId && thread.assignedTeacherId !== teacherId) {
      return {
        success: false,
        error: 'No puedes liberar una consulta asignada a otro profesor.',
      };
    }

    const now = new Date().toISOString();
    await this.db
      .prepare(
        `UPDATE threads
         SET assigned_teacher_id = NULL, assigned_teacher_name = NULL, updated_at = ?
         WHERE id = ?`
      )
      .bind(now, threadId)
      .run();

    const updated = await this.getThread(threadId);
    return { success: true, thread: updated! };
  }

  async setAiMode(
    threadId: string,
    mode: AiParticipationMode
  ): Promise<ConversationThread | null> {
    const now = new Date().toISOString();
    const res = await this.db
      .prepare('UPDATE threads SET ai_mode = ?, updated_at = ? WHERE id = ?')
      .bind(mode, now, threadId)
      .run();

    if ((res.meta?.changes ?? 0) === 0) return null;
    return this.getThread(threadId);
  }

  async addMessage(
    threadId: string,
    message: Omit<RoomMessage, 'id' | 'threadId' | 'createdAt'>
  ): Promise<RoomMessage> {
    const thread = await this.getThread(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    const id = generateId('msg');
    const now = new Date().toISOString();
    const directiveJson = message.feedbackDirective
      ? JSON.stringify(message.feedbackDirective)
      : null;

    await this.db
      .prepare(
        `INSERT INTO messages (id, thread_id, sender_id, sender_name, sender_role, text, feedback_directive_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        threadId,
        message.senderId,
        message.senderName,
        message.senderRole,
        message.text,
        directiveJson,
        now
      )
      .run();

    await this.db
      .prepare('UPDATE threads SET updated_at = ? WHERE id = ?')
      .bind(now, threadId)
      .run();

    return {
      id,
      threadId,
      senderId: message.senderId,
      senderName: message.senderName,
      senderRole: message.senderRole,
      text: message.text,
      feedbackDirective: message.feedbackDirective,
      createdAt: now,
    };
  }

  async getMessages(threadId: string, since?: string): Promise<RoomMessage[]> {
    let query = 'SELECT * FROM messages WHERE thread_id = ?';
    const params: any[] = [threadId];

    if (since) {
      query += ' AND created_at > ?';
      params.push(since);
    }
    query += ' ORDER BY created_at ASC';

    const res = await this.db.prepare(query).bind(...params).all<any>();
    return res.results.map((r) => this.mapMessage(r));
  }

  async importMessages(
    threadId: string,
    messages: { role: string; text: string; senderRole?: string; senderName?: string; senderId?: string }[],
    studentInfo?: { id: string; name: string }
  ): Promise<RoomMessage[]> {
    const thread = await this.getThread(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    const existing = await this.getMessages(threadId);
    const existingKeys = new Set(existing.map((m) => `${m.senderRole}:${m.text.trim()}`));

    const baseTime = Date.now() - (messages.length + 1) * 1000;
    const imported: RoomMessage[] = [];

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

      await this.db
        .prepare(
          `INSERT INTO messages (id, thread_id, sender_id, sender_name, sender_role, text, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(id, threadId, senderId, senderName, senderRole, msg.text.trim(), createdAt)
        .run();

      const roomMsg: RoomMessage = {
        id,
        threadId,
        senderId,
        senderName,
        senderRole,
        text: msg.text.trim(),
        createdAt,
      };

      imported.push(roomMsg);
      existingKeys.add(key);
    }

    const now = new Date().toISOString();
    await this.db.prepare('UPDATE threads SET updated_at = ? WHERE id = ?').bind(now, threadId).run();

    return this.getMessages(threadId);
  }

  async addTeacherFeedback(
    entry: Omit<TeacherFeedbackEntry, 'id' | 'status' | 'createdAt' | 'updatedAt'> & {
      status?: FeedbackStatus;
    }
  ): Promise<TeacherFeedbackEntry> {
    const id = generateId('tfb');
    const now = new Date().toISOString();
    const status = entry.status || 'active';
    const tagsJson = JSON.stringify(entry.topicTags || []);

    await this.db
      .prepare(
        `INSERT INTO teacher_feedback (id, message_id, teacher_id, teacher_name, student_id, student_name, course_id, topic_tags, directive_type, title, directive_content, original_teacher_message, status, quality_score, admin_review_notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        entry.messageId || null,
        entry.teacherId,
        entry.teacherName,
        entry.studentId,
        entry.studentName,
        entry.courseId,
        tagsJson,
        entry.directiveType,
        entry.title,
        entry.directiveContent,
        entry.originalTeacherMessage,
        status,
        entry.qualityScore ?? 5,
        entry.adminReviewNotes || null,
        now,
        now
      )
      .run();

    return {
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
      status,
      qualityScore: entry.qualityScore,
      adminReviewNotes: entry.adminReviewNotes,
      createdAt: now,
      updatedAt: now,
    };
  }

  async updateTeacherFeedback(
    id: string,
    update: Partial<Pick<TeacherFeedbackEntry, 'status' | 'qualityScore' | 'adminReviewNotes' | 'title' | 'directiveContent'>>
  ): Promise<TeacherFeedbackEntry | null> {
    const existing = await this.db
      .prepare('SELECT * FROM teacher_feedback WHERE id = ?')
      .bind(id)
      .first<any>();

    if (!existing) return null;

    const newStatus = update.status ?? existing.status;
    const newQuality = update.qualityScore !== undefined ? update.qualityScore : existing.quality_score;
    const newNotes = update.adminReviewNotes !== undefined ? update.adminReviewNotes : existing.admin_review_notes;
    const newTitle = update.title ?? existing.title;
    const newContent = update.directiveContent ?? existing.directive_content;
    const now = new Date().toISOString();

    await this.db
      .prepare(
        `UPDATE teacher_feedback
         SET status = ?, quality_score = ?, admin_review_notes = ?, title = ?, directive_content = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(newStatus, newQuality, newNotes, newTitle, newContent, now, id)
      .run();

    const updated = await this.db
      .prepare('SELECT * FROM teacher_feedback WHERE id = ?')
      .bind(id)
      .first<any>();

    return this.mapFeedback(updated);
  }

  async deleteTeacherFeedback(id: string): Promise<boolean> {
    const res = await this.db
      .prepare('DELETE FROM teacher_feedback WHERE id = ?')
      .bind(id)
      .run();
    return (res.meta?.changes ?? 0) > 0;
  }

  async listTeacherFeedback(filters?: {
    courseId?: string;
    teacherId?: string;
    status?: FeedbackStatus;
  }): Promise<TeacherFeedbackEntry[]> {
    let query = 'SELECT * FROM teacher_feedback WHERE 1=1';
    const params: any[] = [];

    if (filters?.courseId) {
      query += ' AND course_id = ?';
      params.push(filters.courseId);
    }
    if (filters?.teacherId) {
      query += ' AND teacher_id = ?';
      params.push(filters.teacherId);
    }
    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    query += ' ORDER BY created_at DESC';

    const res = await this.db.prepare(query).bind(...params).all<any>();
    return res.results.map((r) => this.mapFeedback(r));
  }

  async getStrategicFeedback(
    courseId: string,
    topicQuery?: string
  ): Promise<TeacherFeedbackEntry[]> {
    const res = await this.db
      .prepare(
        "SELECT * FROM teacher_feedback WHERE status = 'active' AND (course_id = ? OR course_id = 'all') ORDER BY created_at DESC"
      )
      .bind(courseId)
      .all<any>();

    let list = res.results.map((r) => this.mapFeedback(r));

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

  private mapThread(row: any): ConversationThread {
    let participatingTeacherIds: string[] = [];
    if (row.participating_teacher_ids) {
      try {
        participatingTeacherIds = JSON.parse(row.participating_teacher_ids);
      } catch {
        participatingTeacherIds = [];
      }
    }

    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      courseId: row.course_id,
      isShared: Boolean(row.is_shared),
      assignedTeacherId: row.assigned_teacher_id || null,
      assignedTeacherName: row.assigned_teacher_name || null,
      participatingTeacherIds,
      aiMode: row.ai_mode as AiParticipationMode,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapMessage(row: any): RoomMessage {
    let feedbackDirective = undefined;
    if (row.feedback_directive_json) {
      try {
        feedbackDirective = JSON.parse(row.feedback_directive_json);
      } catch {
        // ignore
      }
    }

    return {
      id: row.id,
      threadId: row.thread_id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      senderRole: row.sender_role,
      text: row.text,
      feedbackDirective,
      createdAt: row.created_at,
    };
  }

  private mapFeedback(row: any): TeacherFeedbackEntry {
    let topicTags: string[] = [];
    if (row.topic_tags) {
      try {
        topicTags = JSON.parse(row.topic_tags);
      } catch {
        topicTags = [];
      }
    }

    return {
      id: row.id,
      messageId: row.message_id || undefined,
      teacherId: row.teacher_id,
      teacherName: row.teacher_name,
      studentId: row.student_id,
      studentName: row.student_name,
      courseId: row.course_id,
      topicTags,
      directiveType: row.directive_type as DirectiveType,
      title: row.title,
      directiveContent: row.directive_content,
      originalTeacherMessage: row.original_teacher_message,
      status: row.status as FeedbackStatus,
      qualityScore: row.quality_score,
      adminReviewNotes: row.admin_review_notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
