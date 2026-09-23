Feature: Cloudflare D1 Relational Persistence & Delegated Authentication
  As the platform architect
  I want persistent relational storage in Cloudflare D1 and zero-trust delegated authentication
  So that user data, chats, and directives persist across edge restarts and root admin access is secured without plain-text passwords in environment variables

  Scenario: Initial D1 schema creation and table initialization
    Given a clean Cloudflare D1 database instance
    When running the initial migration schema
    Then tables "users", "sessions", "threads", "messages", "teacher_feedback", and "student_profiles" are created
    And relational foreign keys and indexes are successfully established

  Scenario: Delegated Root Admin authentication via Cloudflare Access headers without plain-text passwords
    Given an allowed administrator email configured via "ROOT_ADMIN_EMAILS"
    When an incoming request arrives at "/backoffice" with header "Cf-Access-Authenticated-User-Email" matching an allowed email
    Then Maxister verifies the delegated identity
    And creates or acknowledges an active root administrator session without prompting for a password

  Scenario: Unauthorized email rejected for Delegated Root Admin access
    Given an allowed administrator email configured via "ROOT_ADMIN_EMAILS"
    When an incoming request arrives with header "Cf-Access-Authenticated-User-Email" for an unlisted email "intruder@external.com"
    Then access to backoffice is rejected with 403 Forbidden status
    And no root administrator session is issued

  Scenario: User registration, PBKDF2 hashing, and session persistence in D1
    Given an active D1 database instance
    When a student registers with email "student1@desde0.dev" and password "StudentPass123!"
    Then the student record is persisted in table "users" with PBKDF2 password hash and salt
    And an active session is generated in table "sessions"
    And validating the session token returns the authenticated student profile

  Scenario: Multi-thread conversations, message history, and room sharing in D1
    Given an authenticated student in D1
    When the student creates two conversation threads and escalates one to a shared room
    Then both threads are stored in table "threads" with appropriate "is_shared" flags
    And chat messages sent to the shared thread are persisted in table "messages"
    And a teacher claiming the room persists the assignment in table "threads"

  Scenario: Teacher strategic feedback directives and revert lifecycle in D1
    Given an authenticated teacher in D1
    When a teacher submits a strategic feedback directive for course "kotlin-beginners"
    Then the directive is persisted in table "teacher_feedback" with status "active"
    And reverting the directive updates its status to "archived" in D1

  Scenario: Seamless fallback to in-memory store when D1 binding is absent
    Given a runtime environment where Cloudflare D1 binding "DB" is undefined
    When invoking store resolvers "getAuthStore", "getConversationStore", and "getStudentMemoryStore"
    Then the system returns functional in-memory store instances
    And all existing unit tests and local mocks execute without requiring a database process
