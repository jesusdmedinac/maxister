Feature: Student Profile and Persistent Memory
  As Maxister the Companion
  I want to track each student's progress, mastered concepts, weaknesses, and tutor notes
  So that I can personalize every conversation and pick up seamlessly where we left off

  Scenario: Create and retrieve a student profile
    Given a new student named "Carlos" enrolled in "para-no-programadores"
    When the student memory store creates the profile
    Then the student is assigned an active course and default current lesson 1
    And the student profile can be retrieved by ID or username

  Scenario: Update lesson progress and record mastered skills
    Given an existing student profile currently on lesson 1
    When the student successfully completes the weekly challenge for lesson 1
    Then the current lesson progresses to lesson 2
    And "variables" and "console logging" are added to mastered concepts

  Scenario: Record struggling concepts and persistent tutor notes
    Given a student struggling with "Null Safety" and "Elvis Operator"
    When Maxister notes these learning hurdles during a tutoring session
    Then "null-safety" is recorded under struggling concepts
    And a pedagogical observation note is appended to the student's record
