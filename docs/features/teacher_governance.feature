Feature: Teacher Governance & Backoffice Management
  As a Root Administrator
  I want a secure Backoffice portal to manage verified human teachers and audit strategic AI memory
  And I want to ensure students cannot access teacher provisioning or escalate privileges
  So that the academy maintains pedagogical authority, security, and quality oversight

  Scenario: Root admin signs in with credentials from Cloudflare environment variables
    Given root admin credentials configured via "ROOT_ADMIN_EMAIL" and "ROOT_ADMIN_PASSWORD"
    When the administrator submits valid root credentials at "/api/backoffice/login"
    Then authentication succeeds and a secure root administrator session is issued

  Scenario: Root admin provisions a new verified teacher
    Given an authenticated root administrator session
    When the admin creates a teacher with name "Jesús Medina", email "jesus@desde0.dev", and assigned course "kotlin-beginners"
    Then a verified teacher account is created with role "teacher"
    And the teacher is able to log into Maxister using teacher credentials

  Scenario: Regular student is barred with 403 Forbidden from backoffice
    Given an authenticated student user "Mariana" with role "student"
    When the student attempts to access "/backoffice" or "/api/backoffice/teachers"
    Then access is rejected with a 403 Forbidden status

  Scenario: Root admin deactivates a teacher account and revokes active sessions
    Given an active verified teacher account "jesus@desde0.dev"
    When the root administrator sets the teacher status to inactive
    Then subsequent login attempts by that teacher are rejected
    And any existing active sessions for that teacher are revoked

  Scenario: Root admin manages, qualifies, and blocks entries in TeacherFeedbackStore
    Given an existing teacher feedback entry submitted by a teacher
    When the root administrator evaluates the entry and assigns a quality score of 5
    And updates the entry status to "active"
    Then the feedback entry is approved for injection into Maxister's system prompt
    When the root administrator blocks an inappropriate feedback entry
    Then the entry is marked as "blocked" and excluded from prompt injection
