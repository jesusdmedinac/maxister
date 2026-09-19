Feature: Tripartite Interactive Chat & Strategic Teacher Feedback Memory
  As a student, human teacher, and Maxister AI tutor
  I want an interactive shared room where students and teachers collaborate
  And I want Maxister to intelligently adapt its participation mode, listen continuously, and automatically extract teacher feedback
  So that students receive immediate guidance and Maxister's strategic pedagogical memory evolves with teacher expertise

  Scenario: Single student chat enforces AI On and hides AI Mode selector
    Given a student chatting in a personal unshared conversation
    When viewing the chat studio interface
    Then the AI Participation Mode is locked to "on"
    And the AI Mode selector control is completely hidden from the UI

  Scenario: In AI Off mode, Maxister listens in the background without generating spoken output
    Given an active tripartite room with a student and a teacher
    When the participation mode is set to "off"
    And the student and teacher exchange messages
    Then Maxister does not generate a response message
    And Maxister ingests the exchange in background memory to maintain full conversation context

  Scenario: In AI Auto mode, Maxister responds when a participant explicitly refers to it
    Given an active tripartite room in "auto" mode
    When a participant sends a message addressing the AI: "Maxister, ¿cómo resumirías este concepto?"
    Then Maxister detects the direct reference and streams a Socratic response

  Scenario: Maxister automatically detects teacher pedagogical directive, saves it to TeacherFeedbackStore, and displays an explicit badge
    Given an active tripartite room with teacher "Jesús Medina"
    When the teacher sends a message containing pedagogical guidance: "No uses 'var' en Kotlin, explica 'val' con la analogía de la caja fuerte"
    Then Maxister automatically classifies the message as a pedagogical directive
    And records a TeacherFeedbackEntry tagged with student, teacher, and course
    And an explicit badge is displayed under the teacher's message confirming the directive was stored
    And Maxister does not interrupt or re-explain to the student

  Scenario: Strategic teacher feedback tagged by student, teacher, and course is retrieved and applied in subsequent inquiries
    Given stored and approved teacher feedback regarding "val vs var" in course "kotlin-beginners"
    When another student asks a question about variables in "kotlin-beginners"
    Then Maxister's prompt context is enriched with the teacher's approved directive
    And Maxister adheres to the teacher's pedagogical guidance in its Socratic response
