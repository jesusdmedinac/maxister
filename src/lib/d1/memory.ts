import type { D1Database } from './db';
import type { StudentProfile, ProgressUpdate } from '../memory';

export class D1StudentMemoryStore {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async createOrGetStudent(
    id: string,
    name: string = 'Estudiante Desde0',
    activeCourse: string = 'para-no-programadores'
  ): Promise<StudentProfile> {
    const existing = await this.getStudent(id);
    if (existing) return existing;

    const now = new Date().toISOString();
    await this.db
      .prepare(
        `INSERT INTO student_profiles (student_id, name, active_course, current_lesson, mastered_skills, struggling_concepts, tutor_notes, updated_at)
         VALUES (?, ?, ?, 1, '[]', '[]', '[]', ?)`
      )
      .bind(id, name, activeCourse, now)
      .run();

    return {
      id,
      name,
      activeCourse,
      currentLesson: 1,
      masteredConcepts: [],
      strugglingConcepts: [],
      notes: [],
      updatedAt: now,
    };
  }

  async getStudent(id: string): Promise<StudentProfile | null> {
    const row = await this.db
      .prepare('SELECT * FROM student_profiles WHERE student_id = ?')
      .bind(id)
      .first<any>();

    if (!row) return null;
    return this.mapProfile(row);
  }

  async listStudents(): Promise<StudentProfile[]> {
    const res = await this.db
      .prepare('SELECT * FROM student_profiles ORDER BY updated_at DESC')
      .all<any>();

    return res.results.map((r) => this.mapProfile(r));
  }

  async updateProgress(id: string, update: ProgressUpdate): Promise<StudentProfile | null> {
    const student = await this.createOrGetStudent(id);

    let activeCourse = student.activeCourse;
    let currentLesson = student.currentLesson;
    let mastered = [...student.masteredConcepts];
    let struggling = [...student.strugglingConcepts];
    let notes = [...student.notes];

    if (update.activeCourse) {
      activeCourse = update.activeCourse;
    }
    if (update.currentLesson !== undefined) {
      currentLesson = update.currentLesson;
    }
    if (update.addMasteredConcepts && update.addMasteredConcepts.length > 0) {
      mastered = Array.from(new Set([...mastered, ...update.addMasteredConcepts]));
    }
    if (update.addStrugglingConcepts && update.addStrugglingConcepts.length > 0) {
      struggling = Array.from(new Set([...struggling, ...update.addStrugglingConcepts]));
    }
    if (update.addNote) {
      notes.push(update.addNote);
    }

    const now = new Date().toISOString();
    await this.db
      .prepare(
        `UPDATE student_profiles
         SET active_course = ?, current_lesson = ?, mastered_skills = ?, struggling_concepts = ?, tutor_notes = ?, updated_at = ?
         WHERE student_id = ?`
      )
      .bind(
        activeCourse,
        currentLesson,
        JSON.stringify(mastered),
        JSON.stringify(struggling),
        JSON.stringify(notes),
        now,
        id
      )
      .run();

    return {
      id,
      name: student.name,
      activeCourse,
      currentLesson,
      masteredConcepts: mastered,
      strugglingConcepts: struggling,
      notes,
      updatedAt: now,
    };
  }

  private mapProfile(row: any): StudentProfile {
    let masteredConcepts: string[] = [];
    let strugglingConcepts: string[] = [];
    let notes: string[] = [];

    try {
      if (row.mastered_skills) masteredConcepts = JSON.parse(row.mastered_skills);
    } catch {}
    try {
      if (row.struggling_concepts) strugglingConcepts = JSON.parse(row.struggling_concepts);
    } catch {}
    try {
      if (row.tutor_notes) notes = JSON.parse(row.tutor_notes);
    } catch {}

    return {
      id: row.student_id,
      name: row.name,
      activeCourse: row.active_course,
      currentLesson: Number(row.current_lesson) || 1,
      masteredConcepts,
      strugglingConcepts,
      notes,
      updatedAt: row.updated_at,
    };
  }
}
