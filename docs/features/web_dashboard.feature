Feature: Interactive Web Dashboard
  As a Desde0 student
  I want a visual workspace where I can explore the curriculum, chat with Maxister in real-time, and see my learning memory
  So that I have a central companion studio for my studies

  Scenario: Browse courses and switch active lesson in sidebar
    Given the student opens the Maxister dashboard
    When the student selects "Kotlin for Beginners" and clicks "Lesson 2"
    Then the active lesson details and phase overview are displayed
    And the chat context switches to lesson 2

  Scenario: Real-time interactive chat with streaming and Markdown formatting
    Given an active tutoring conversation
    When the student sends a question
    Then the response streams smoothly in the chat window
    And code snippets are rendered with syntax highlighting and copy buttons

  Scenario: Live student profile and skills inspection
    Given a student with registered progress
    When viewing the student profile panel
    Then it displays the current lesson number, mastered concepts tags, and improvement areas
    And allows switching or creating student profiles
