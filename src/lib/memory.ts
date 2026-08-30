import fs from 'node:fs/promises';
import path from 'node:path';

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
  private persistPath?: string;

  constructor(persistPath?: string) {
    this.persistPath = persistPath;
  }

  async load(): Promise<void> {
    if (!this.persistPath) return;
    try {
      const data = await fs.readFile(this.persistPath, 'utf-8');
      const parsed = JSON.parse(data) as Record<string, StudentProfile>;
      for (const [id, student] of Object.entries(parsed)) {
        this.students.set(id, student);
      }
    } catch {
      // File does not exist yet or cannot be read, continue with empty map
    }
  }

  private async save(): Promise<void> {
    if (!this.persistPath) return;
    try {
      const dir = path.dirname(this.persistPath);
      await fs.mkdir(dir, { recursive: true });
      const obj: Record<string, StudentProfile> = {};
      for (const [id, student] of this.students.entries()) {
        obj[id] = student;
      }
      await fs.writeFile(this.persistPath, JSON.stringify(obj, null, 2), 'utf-8');
    } catch {
      // Silent error on storage failure
    }
  }

  async createOrGetStudent(
    id: string,
    name: string,
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
      await this.save();
    }
    return student;
  }

  async getStudent(id: string): Promise<StudentProfile | null> {
    return this.students.get(id) || null;
  }

  async updateProgress(id: string, update: ProgressUpdate): Promise<StudentProfile | null> {
    const student = this.students.get(id);
    if (!student) return null;

    if (update.activeCourse) student.activeCourse = update.activeCourse;
    if (update.currentLesson !== undefined) student.currentLesson = update.currentLesson;

    if (update.addMasteredConcepts) {
      for (const c of update.addMasteredConcepts) {
        if (!student.masteredConcepts.includes(c)) {
          student.masteredConcepts.push(c);
        }
        // If mastered, remove from struggling
        student.strugglingConcepts = student.strugglingConcepts.filter((sc) => sc !== c);
      }
    }

    if (update.addStrugglingConcepts) {
      for (const c of update.addStrugglingConcepts) {
        if (!student.strugglingConcepts.includes(c) && !student.masteredConcepts.includes(c)) {
          student.strugglingConcepts.push(c);
        }
      }
    }

    if (update.addNote) {
      student.notes.push(update.addNote);
    }

    student.updatedAt = new Date().toISOString();
    await this.save();
    return student;
  }

  async listStudents(): Promise<StudentProfile[]> {
    return Array.from(this.students.values());
  }
}

// Global default instance for the app
const defaultPersistPath = path.resolve(process.cwd(), '.maxister-memory.json');
export const defaultMemoryStore = new MemoryStore(defaultPersistPath);
