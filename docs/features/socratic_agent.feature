Feature: Socratic AI Tutor Agent
  As an aspiring developer studying in Desde0
  I want Maxister to guide me with real-world analogies, diagnostic questions, and guided hints
  So that I truly understand computer science principles without getting spoiled answers

  Scenario: Inquire with contextual student and lesson grounding
    Given student "Carlos" on lesson 2 of "para-no-programadores"
    And Carlos asks "What is a variable?"
    When the Socratic agent generates an answer
    Then it grounds the explanation using real-world analogies (e.g., labeled boxes or storage compartments)
    And it references the context of the current lesson
    And it does not overwhelm with advanced topics from later lessons

  Scenario: Request help on a coding challenge without receiving full solution
    Given student "Ana" working on lesson 2 challenge of "kotlin-beginners"
    And Ana asks "Give me the full code for the exercise"
    When the agent evaluates the request
    Then it refuses to output the complete solution verbatim
    And it provides step-by-step guidance, leading questions, and hints to help Ana write it herself

  Scenario: Interactive debugging guidance for error messages
    Given student presents a "NullPointerException" or syntax error
    When the student asks "Why did my code crash?"
    Then Maxister explains what the error type means in plain language
    And guides the student to look at the exact line of failure and identify the cause
