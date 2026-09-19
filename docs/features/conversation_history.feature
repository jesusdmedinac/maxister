Feature: Multi-Thread Conversation History & 1-to-1 Shared Rooms
  As a student or human teacher
  I want to maintain a persistent history of my conversations with Maxister
  And as a student, I want to escalate any thread into a shared consultation for a human teacher
  And as a teacher, I want to claim, attend, or release consultations with a strict 1-to-1 rule
  So that learning continuity is preserved and mentors can seamlessly collaborate with students

  Scenario: Student creates multiple conversation threads and switches between them in sidebar
    Given an authenticated student "Mariana"
    When the student creates two separate conversation threads "Variables en Kotlin" and "POO en JavaScript"
    Then both threads are stored in the student's conversation history
    And switching between threads loads the corresponding messages

  Scenario: Student escalates thread into a shared room, automatically transitioning default mode to AI Auto
    Given an active student conversation thread currently in "AI On" mode
    When the student shares the conversation with the teacher
    Then a shared consultation room identifier is generated
    And the room's default AI Participation Mode automatically transitions to "auto"

  Scenario: Teacher views separate sections for personal chats and student shared consultations
    Given an authenticated teacher "Jesús Medina"
    When the teacher accesses the Maxister studio
    Then the sidebar displays "Mis Conversaciones" for personal AI chats
    And displays "Consultas de Estudiantes" listing open and claimed consultations

  Scenario: Teacher claims room locking it 1-to-1 and reveals AI Mode selector
    Given an open shared consultation from student "Mariana"
    When teacher "Jesús Medina" claims the consultation
    Then the room is locked with assignedTeacherId "jesus@desde0.dev"
    And the 3-state AI Participation Mode selector becomes visible to both student and teacher
    When another teacher attempts to claim the same room
    Then the claim request is rejected because the room is already attended

  Scenario: Assigned teacher releases room; messages persist and room reverts to open claim state
    Given a shared consultation currently attended by teacher "Jesús Medina" containing 6 messages
    When teacher "Jesús Medina" releases the consultation
    Then the assignedTeacherId is cleared
    And all 6 existing messages remain intact in history
    And the room status reverts to open so another teacher can claim it
