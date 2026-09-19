Feature: Student Authentication & Human Teacher Escalation
  As a student of Desde0 Academy
  I want to create an account, log in securely, and maintain my learning identity
  And I want the ability to share my tutoring conversations with a human teacher anytime I need direct human help
  So that I have a personalized learning journey with immediate access to mentorship

  Scenario: Register a new student account with validation and password hashing
    Given a prospective student with name "Mariana", email "mariana@desde0.dev", and password "secur3Pass!"
    When the student submits registration with initial course "kotlin-beginners"
    Then a new student account is created with a PBKDF2 hashed password
    And a secure session token is generated for the student
    And the initial student profile is associated with "kotlin-beginners"

  Scenario: Prevent duplicate account registration with the same email
    Given an existing registered student with email "mariana@desde0.dev"
    When another registration attempt is made with email "mariana@desde0.dev"
    Then the registration is rejected with an account already exists error

  Scenario: Log in with valid credentials and issue secure session cookie
    Given an existing student with email "mariana@desde0.dev" and password "secur3Pass!"
    When the student logs in with correct email and password
    Then authentication succeeds and a valid session is created
    And the user profile returns name "Mariana" and email "mariana@desde0.dev"

  Scenario: Reject login with invalid email or incorrect password
    Given an existing student with email "mariana@desde0.dev" and password "secur3Pass!"
    When the student logs in with password "wrongPassword"
    Then authentication fails with an invalid credentials error
    When an unregistered user tries to log in with email "unknown@desde0.dev"
    Then authentication fails with an invalid credentials error

  Scenario: Inspect session state and log out terminating session
    Given an active authenticated session for student "mariana@desde0.dev"
    When the session is validated via session token
    Then the active student profile is returned
    When the student logs out
    Then the session token is revoked and subsequent validation fails

  Scenario: Authenticated student creates a shared chat snapshot for the teacher
    Given an authenticated student "Mariana" enrolled in "kotlin-beginners"
    And an active conversation with Maxister containing 4 messages
    When the student shares the conversation with the human teacher
    Then a unique shared chat snapshot is created
    And a shareable URL identifier is generated containing the student identity, course, and message history

  Scenario: Human teacher accesses and inspects a shared student chat via unique link
    Given a valid shared chat snapshot identifier
    When the teacher requests the shared chat details
    Then the snapshot is retrieved with student name "Mariana", course "kotlin-beginners", and the full message transcript
