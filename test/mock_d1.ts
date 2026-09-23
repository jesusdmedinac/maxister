import { DatabaseSync } from 'node:sqlite';

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: {
    duration?: number;
    changes?: number;
    last_row_id?: number;
    served_by?: string;
  };
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
  dump(): Promise<ArrayBuffer>;
}

class MockD1PreparedStatement implements D1PreparedStatement {
  private query: string;
  private db: DatabaseSync;
  private boundValues: any[] = [];

  constructor(db: DatabaseSync, query: string, values: any[] = []) {
    this.db = db;
    this.query = query;
    this.boundValues = values;
  }

  bind(...values: any[]): D1PreparedStatement {
    return new MockD1PreparedStatement(this.db, this.query, values);
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    const stmt = this.db.prepare(this.query);
    const row = stmt.get(...this.boundValues) as any;
    if (!row) return null;
    if (colName) return row[colName] ?? null;
    return row as T;
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    const stmt = this.db.prepare(this.query);
    const rows = stmt.all(...this.boundValues) as T[];
    return {
      results: rows,
      success: true,
      meta: { changes: 0 },
    };
  }

  async run<T = unknown>(): Promise<D1Result<T>> {
    const stmt = this.db.prepare(this.query);
    const result = stmt.run(...this.boundValues);
    return {
      results: [],
      success: true,
      meta: {
        changes: Number(result.changes),
        last_row_id: Number(result.lastInsertRowid),
      },
    };
  }

  async raw<T = unknown>(): Promise<T[]> {
    const res = await this.all<T>();
    return res.results;
  }
}

export class MockD1Database implements D1Database {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db || new DatabaseSync(':memory:');
    // Enable foreign keys
    this.db.exec('PRAGMA foreign_keys = ON;');
  }

  prepare(query: string): D1PreparedStatement {
    return new MockD1PreparedStatement(this.db, query);
  }

  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    const results: D1Result<T>[] = [];
    this.db.exec('BEGIN TRANSACTION;');
    try {
      for (const stmt of statements) {
        const res = await stmt.run<T>();
        results.push(res);
      }
      this.db.exec('COMMIT;');
      return results;
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  async exec(query: string): Promise<D1ExecResult> {
    this.db.exec(query);
    return { count: 1, duration: 0 };
  }

  async dump(): Promise<ArrayBuffer> {
    return new ArrayBuffer(0);
  }

  getRawDb(): DatabaseSync {
    return this.db;
  }
}

export function createMockD1(): D1Database {
  return new MockD1Database();
}
