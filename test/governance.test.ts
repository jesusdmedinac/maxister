import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InMemoryAuthStore } from '../src/lib/auth';
import { InMemoryConversationStore } from '../src/lib/conversations';

describe('Feature 7: Teacher Governance & Backoffice Management', () => {
  let authStore: InMemoryAuthStore;
  let convStore: InMemoryConversationStore;

  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ROOT_ADMIN_EMAIL: 'admin@desde0.dev',
      ROOT_ADMIN_PASSWORD: 'superSecretRootPassword123!',
    };
    authStore = new InMemoryAuthStore();
    convStore = new InMemoryConversationStore();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Scenario 1: Root admin signs in with credentials from Cloudflare environment variables', () => {
    it('should authenticate root admin against environment variables and issue root session', async () => {
      const result = await authStore.authenticateRootAdmin(
        'admin@desde0.dev',
        'superSecretRootPassword123!'
      );

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.role).toBe('root_admin');
      expect(result.user?.email).toBe('admin@desde0.dev');
      expect(result.sessionToken).toBeDefined();

      const validated = await authStore.validateSession(result.sessionToken!);
      expect(validated?.role).toBe('root_admin');
    });

    it('should reject invalid root admin credentials', async () => {
      const result = await authStore.authenticateRootAdmin(
        'admin@desde0.dev',
        'wrongRootPassword'
      );
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/invalid/i);
    });
  });

  describe('Scenario 2: Root admin provisions a new verified teacher', () => {
    it('should provision a teacher account with role "teacher" and allow login', async () => {
      const teacherResult = await authStore.createTeacher({
        name: 'Jesús Medina',
        email: 'jesus@desde0.dev',
        password: 'teacherPassword123!',
        assignedCourses: ['kotlin-beginners', 'para-no-programadores'],
      });

      expect(teacherResult.success).toBe(true);
      expect(teacherResult.user?.role).toBe('teacher');
      expect(teacherResult.user?.name).toBe('Jesús Medina');

      // Verify teacher can log in
      const loginResult = await authStore.authenticate('jesus@desde0.dev', 'teacherPassword123!');
      expect(loginResult.success).toBe(true);
      expect(loginResult.user?.role).toBe('teacher');
    });
  });

  describe('Scenario 3: Regular student is barred with 403 Forbidden from backoffice', () => {
    it('should verify that students and unauthenticated users are not permitted in backoffice', async () => {
      const studentReg = await authStore.registerUser({
        name: 'Mariana',
        email: 'mariana@desde0.dev',
        password: 'studentPassword123!',
      });

      const studentUser = await authStore.validateSession(studentReg.sessionToken!);
      expect(studentUser?.role).toBe('student');

      expect(authStore.canAccessBackoffice(studentUser)).toBe(false);

      const rootAdminResult = await authStore.authenticateRootAdmin(
        'admin@desde0.dev',
        'superSecretRootPassword123!'
      );
      const rootUser = await authStore.validateSession(rootAdminResult.sessionToken!);
      expect(authStore.canAccessBackoffice(rootUser)).toBe(true);
    });
  });

  describe('Scenario 4: Root admin deactivates a teacher account and revokes active sessions', () => {
    it('should deactivate teacher, revoke active sessions, and prevent subsequent logins', async () => {
      const created = await authStore.createTeacher({
        name: 'Jesús Medina',
        email: 'jesus@desde0.dev',
        password: 'teacherPassword123!',
        assignedCourses: ['kotlin-beginners'],
      });

      // Teacher logs in and gets a session
      const login = await authStore.authenticate('jesus@desde0.dev', 'teacherPassword123!');
      const activeSessionToken = login.sessionToken!;

      // Deactivate teacher
      const deactivation = await authStore.setTeacherStatus(created.user!.id, false);
      expect(deactivation).toBe(true);

      // Existing session should be invalid
      const validatedAfter = await authStore.validateSession(activeSessionToken);
      expect(validatedAfter).toBeNull();

      // Subsequent login attempt must fail
      const loginAfter = await authStore.authenticate('jesus@desde0.dev', 'teacherPassword123!');
      expect(loginAfter.success).toBe(false);
      expect(loginAfter.error).toMatch(/deactivated|disabled|inactive/i);
    });
  });

  describe('Scenario 5: Root admin manages, qualifies, and blocks entries in TeacherFeedbackStore', () => {
    it('should allow root admin to rate quality 1-5, approve, and block strategic feedback', async () => {
      const entry = await convStore.addTeacherFeedback({
        teacherId: 'teacher_1',
        teacherName: 'Jesús Medina',
        studentId: 'student_1',
        studentName: 'Mariana',
        courseId: 'kotlin-beginners',
        topicTags: ['val-vs-var', 'immutability'],
        directiveType: 'recommended_analogy',
        title: 'Analogía de la caja fuerte para val',
        directiveContent: 'Explicar que val es como una caja fuerte sellada una vez que guardas algo.',
        originalTeacherMessage: 'Para explicar val usa la analogía de la caja fuerte sellada.',
      });

      expect(entry.id).toBeDefined();
      expect(entry.status).toBe('active');

      // Root Admin qualifies the feedback with 5 stars and adds review note
      const qualified = await convStore.updateTeacherFeedback(entry.id, {
        qualityScore: 5,
        adminReviewNotes: 'Excelente analogía pedagógica.',
      });

      expect(qualified?.qualityScore).toBe(5);
      expect(qualified?.adminReviewNotes).toBe('Excelente analogía pedagógica.');

      // Block inappropriate feedback
      const blocked = await convStore.updateTeacherFeedback(entry.id, {
        status: 'blocked',
      });

      expect(blocked?.status).toBe('blocked');

      // Blocked feedback should not be retrieved for prompt injection
      const activeGuidance = await convStore.getStrategicFeedback('kotlin-beginners', 'val');
      expect(activeGuidance.some((g) => g.id === entry.id)).toBe(false);
    });
  });
});
