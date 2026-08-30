Feature: Academy Knowledge Ingestion and Curriculum Parser
  As the Maxister AI Engine
  I want to read and structure the course curriculum and lesson contents from MDX files
  So that I can provide accurate, contextual, and phase-aware pedagogical tutoring to students

  Scenario: List available courses and curriculum metadata
    Given the Desde0 course repository directories exist
    When the knowledge engine scans available courses
    Then it returns a list containing at least "para-no-programadores" and "kotlin-beginners"
    And each course includes title, description, and list of available lessons

  Scenario: Parse structured 5-phase lesson content from MDX
    Given a lesson MDX file from "para-no-programadores" lesson 1
    When the knowledge engine parses the lesson
    Then it extracts frontmatter metadata (title, description)
    And it separates Phase 2 (Theory), Phase 3 (Guided Practice), Phase 4 (Debugging), and Phase 5 (Weekly Challenge)
    And it extracts reliable resources and links

  Scenario: Search knowledge base for specific topics or errors
    Given a query "NullPointerException" or "variables"
    When the knowledge engine searches across academy lessons
    Then it returns matching lesson snippets and relevant course references
