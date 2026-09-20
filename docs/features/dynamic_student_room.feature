Feature: Dynamic In-Place Student Consultation & Teacher Reaction
  As a Desde0 student chatting with Maxister
  I want my active conversation to dynamically react and update in real-time when a teacher joins
  So that I never have to leave my active chat window or navigate to another page

  Scenario: Student creates a shareable link for the teacher without leaving the main chat view
    Given an authenticated student chatting in the main studio
    When the student opens the share modal and generates a consultation link
    Then the modal displays the exclusive teacher link with copy, email, and discord actions
    And the modal does not display an "Entrar a la Sala Interactiva" navigation button for the student
    And the current conversation thread is marked as shared in the background

  Scenario: Main chat dynamically detects teacher arrival and displays teacher presence
    Given a shared student conversation thread awaiting a teacher
    When a human teacher claims the consultation room
    Then the student's active chat view dynamically renders a live banner indicating the teacher is present
    And the banner displays the assigned teacher's name

  Scenario: Real-time synchronization of teacher messages and feedback directives directly in student chat
    Given an active tripartite consultation with an assigned teacher
    When the teacher posts a message with a pedagogical directive to Maxister
    Then the student's chat view receives the message in real-time
    And the message is styled with the teacher's role indicator
    And an explicit badge is displayed showing that Maxister learned from the teacher directive

  Scenario: Dynamic activation and display of AI participation modes in student chat upon teacher arrival
    Given a student in an active chat where a teacher has joined
    When the student inspects the omnibar control area
    Then the 3-state AI Participation Mode selector is visible and interactive
    And selecting a new mode updates the room participation mode on the server and synchronizes with all participants

  Scenario: Dynamic reversion when assigned teacher leaves or releases the consultation
    Given a shared consultation room currently attended by a teacher
    When the assigned teacher releases the consultation
    Then the student's chat view dynamically updates removing the active teacher presence banner
    And all existing messages remain intact
    And the room returns to an open claimable state for other teachers
