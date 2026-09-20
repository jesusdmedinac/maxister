Feature: Read-Only Rooms, Smart Role Detection & Unified Teacher History
  As a visitor, student, or teacher in Maxister
  I want shared consultation rooms to adapt dynamically to my authentication and role status
  So that unauthenticated visitors have read-only access, teachers can join consultations and keep them in their unified chat history even after releasing them

  Scenario: Unauthenticated guest accesses shared room in read-only mode with unified login action
    Given a shared consultation room URL
    When an unauthenticated guest visits the room
    Then the conversation messages and code are displayed in read-only mode
    And the message input omnibar is replaced with an "Estás viendo esta consulta en modo solo lectura" banner
    And an "Iniciar Sesión" button is displayed to open the authentication modal

  Scenario: Authenticated student owner accesses their own room and unlocks student messaging
    Given an authenticated student who created the shared consultation
    When the student accesses the room
    Then the student is recognized as the consultation owner
    And the message input omnibar is unlocked for active chatting

  Scenario: Authenticated student visitor is restricted with read-only banner
    Given an authenticated student who is not the creator of the shared consultation
    When the student accesses the room
    Then the room remains in read-only mode
    And a banner displays "Estás viendo esta consulta en modo solo lectura"
    And the message input omnibar remains disabled

  Scenario: Authenticated teacher connects to unassigned room, sees "Unirse al chat como profesor", and claims it into their unified chat history
    Given an authenticated teacher accessing a shared consultation with no assigned teacher
    When the room renders
    Then a banner displays "Unirse al chat como profesor" with a claim button
    And when the teacher claims the room
    Then the teacher becomes the assigned teacher
    And the consultation is permanently added to the teacher's unified chat history

  Scenario: Other teachers see assigned teacher banner, and releasing the room preserves the consultation in teacher chat history
    Given a consultation room claimed by teacher "Jesús Medina"
    When another teacher "Carlos López" visits the room
    Then a banner displays "Jesús Medina es el profesor asignado"
    And the room remains read-only for other teachers
    When teacher "Jesús Medina" releases the consultation
    Then the room returns to open claim status
    And the consultation permanently remains in teacher "Jesús Medina"'s unified chat history
