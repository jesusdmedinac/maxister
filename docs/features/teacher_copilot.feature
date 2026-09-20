Feature: Teacher Co-Pilot Experience, Revertable Directives & Unassigned Consultations
  As an authenticated academy teacher in Maxister
  I want Maxister to act as my professional teaching co-pilot without student hand-holding restrictions
  So that I can prepare complete solutions, train AI memory with revertable directives, and attend unassigned student rooms from my home dashboard

  Scenario: Authenticated teacher connects to personal chat and receives Teacher Co-Pilot persona
    Given an authenticated user with role "teacher"
    When the teacher starts a conversation with Maxister in their personal chat
    Then Maxister responds with the "Teacher Co-Pilot" persona
    And Maxister omits the anti-spoonfeeding constraint, providing direct, peer-to-peer technical and pedagogical assistance

  Scenario: Teacher requests complete code solutions and unit test suites
    Given an authenticated teacher chatting with Maxister
    When the teacher requests a complete solution with unit tests for a curriculum exercise
    Then Maxister delivers the full implementation and tests without withholding code or ending with Socratic questions

  Scenario: Teacher provides natural language pedagogical directive in personal chat with revert action
    Given an authenticated teacher in their personal chat
    When the teacher sends a message containing a pedagogical directive for a topic
    Then Maxister automatically detects the directive and persists it to TeacherFeedbackStore
    And Maxister's message displays an explicit badge confirming the directive was stored with a "Deshacer" button

  Scenario: Teacher reverts an auto-detected directive directly from the chat badge
    Given a message with an auto-saved teacher directive and its "Deshacer" button
    When the teacher clicks the "Deshacer" button
    Then the directive is removed from TeacherFeedbackStore
    And the badge updates to reflect that the directive was deleted from memory

  Scenario: Teacher home screen displays up to 4 latest unassigned student consultation rooms
    Given several student consultation rooms shared in the academy
    When an authenticated teacher visits the Maxister home screen with no active thread
    Then up to 4 of the latest shared rooms without an assigned teacher are displayed as priority cards
    And each card allows the teacher to claim or join the consultation directly
