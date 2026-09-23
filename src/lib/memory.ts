export interface StudentProfile {
  id: string;
  name: string;
  activeCourse: string;
  currentLesson: number;
  masteredConcepts: string[];
  strugglingConcepts: string[];
  notes: string[];
  updatedAt: string;
}

export interface ProgressUpdate {
  activeCourse?: string;
  currentLesson?: number;
  addMasteredConcepts?: string[];
  addStrugglingConcepts?: string[];
  addNote?: string;
}

export class MemoryStore {
  private students: Map<string, StudentProfile> = new Map();

  constructor() {}

  async load(): Promise<void> {}
  async save(): Promise<void> {}

  async createOrGetStudent(
    id: string,
    name: string = 'Estudiante Desde0',
    activeCourse: string = 'para-no-programadores'
  ): Promise<StudentProfile> {
    let student = this.students.get(id);
    if (!student) {
      student = {
        id,
        name,
        activeCourse,
        currentLesson: 1,
        masteredConcepts: [],
        strugglingConcepts: [],
        notes: [],
        updatedAt: new Date().toISOString(),
      };
      this.students.set(id, student);
    }
    return student;
  }

  async getStudent(id: string): Promise<StudentProfile | null> {
    return this.students.get(id) || null;
  }

  async listStudents(): Promise<StudentProfile[]> {
    return Array.from(this.students.values());
  }

  async updateProgress(id: string, update: ProgressUpdate): Promise<StudentProfile | null> {
    const student = await this.createOrGetStudent(id);

    if (update.activeCourse) {
      student.activeCourse = update.activeCourse;
    }
    if (update.currentLesson !== undefined) {
      student.currentLesson = update.currentLesson;
    }
    if (update.addMasteredConcepts && update.addMasteredConcepts.length > 0) {
      const set = new Set([...student.masteredConcepts, ...update.addMasteredConcepts]);
      student.masteredConcepts = Array.from(set);
    }
    if (update.addStrugglingConcepts && update.addStrugglingConcepts.length > 0) {
      const set = new Set([...student.strugglingConcepts, ...update.addStrugglingConcepts]);
      student.strugglingConcepts = Array.from(set);
    }
    if (update.addNote) {
      student.notes.push(update.addNote);
    }

    student.updatedAt = new Date().toISOString();
    this.students.set(id, student);
    return student;
  }

  clear(): void {
    this.students.clear();
  }
}

export const defaultMemoryStore = new MemoryStore();

import { D1StudentMemoryStore } from './d1/memory';
import { initializeD1Schema, type D1Database } from './d1/db';

const d1MemStoreCache = new WeakMap<object, D1StudentMemoryStore>();

export function getStudentMemoryStore(db?: D1Database): MemoryStore | D1StudentMemoryStore {
  if (!db) return defaultMemoryStore;
  let store = d1MemStoreCache.get(db as object);
  if (!store) {
    initializeD1Schema(db);
    store = new D1StudentMemoryStore(db);
    d1MemStoreCache.set(db as object, store);
  }
  return store;
}
