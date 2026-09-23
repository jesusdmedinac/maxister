-- Maxister Initial Relational Schema for Cloudflare D1 (SQLite)

-- 1. Users (Students, Teachers, and Delegated Root Admins)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT DEFAULT NULL,
  salt TEXT DEFAULT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'root_admin')),
  active_course TEXT NOT NULL,
  assigned_courses TEXT DEFAULT '[]',
  auth_provider TEXT NOT NULL DEFAULT 'credentials' CHECK(auth_provider IN ('credentials', 'cloudflare_access', 'oauth')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2. Sessions
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 3. Threads (Conversation Sessions)
CREATE TABLE IF NOT EXISTS threads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  course_id TEXT NOT NULL,
  is_shared INTEGER NOT NULL DEFAULT 0,
  assigned_teacher_id TEXT DEFAULT NULL,
  assigned_teacher_name TEXT DEFAULT NULL,
  participating_teacher_ids TEXT NOT NULL DEFAULT '[]',
  ai_mode TEXT NOT NULL DEFAULT 'on' CHECK(ai_mode IN ('off', 'auto', 'on')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 4. Messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK(sender_role IN ('student', 'teacher', 'assistant')),
  text TEXT NOT NULL,
  feedback_directive_json TEXT DEFAULT NULL,
  created_at TEXT NOT NULL
);

-- 5. Teacher Feedback Directives
CREATE TABLE IF NOT EXISTS teacher_feedback (
  id TEXT PRIMARY KEY,
  message_id TEXT DEFAULT NULL,
  teacher_id TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  course_id TEXT NOT NULL,
  topic_tags TEXT NOT NULL DEFAULT '[]',
  directive_type TEXT NOT NULL,
  title TEXT NOT NULL,
  directive_content TEXT NOT NULL,
  original_teacher_message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'under_review', 'blocked', 'archived')),
  quality_score INTEGER DEFAULT 5,
  admin_review_notes TEXT DEFAULT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 6. Student Profiles & Memory
CREATE TABLE IF NOT EXISTS student_profiles (
  student_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active_course TEXT NOT NULL,
  current_lesson INTEGER NOT NULL DEFAULT 1,
  mastered_skills TEXT NOT NULL DEFAULT '[]',
  struggling_concepts TEXT NOT NULL DEFAULT '[]',
  tutor_notes TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
);

-- Indexes for optimal querying
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_is_shared ON threads(is_shared);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_feedback_course_status ON teacher_feedback(course_id, status);
