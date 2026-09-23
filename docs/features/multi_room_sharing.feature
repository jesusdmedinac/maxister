Feature: Multi-Room Sharing Synchronization & Live Teacher Inquiries Stream
  As an academy student and teacher in Maxister
  I want students to share multiple distinct conversation threads and teachers to receive them in real time
  So that students get help on different questions simultaneously and teachers always see an up-to-date queue of consultations

  Scenario: Student shares a second conversation thread after having previously shared another
    Given an authenticated student who previously shared a conversation thread "Thread 1"
    And the student is now in a distinct conversation thread "Thread 2"
    When the student opens the share dialog for "Thread 2"
    Then a unique room URL corresponding to "Thread 2" is generated
    And "Thread 2" is persisted with shared status in the conversation store
    And the share dialog does not display or retain the URL from "Thread 1"

  Scenario: Active conversation thread updates to shared state in UI upon sharing
    Given an active student conversation thread that is not yet marked as shared
    When the student completes the share action for that thread
    Then the active thread state transitions to shared
    And the thread list is refreshed to reflect the shared indicator

  Scenario: Teacher dashboard dynamically polls and receives newly shared student rooms
    Given an authenticated teacher with the Maxister dashboard open
    When a student shares a new consultation thread in the academy
    Then the teacher's consultation queue automatically refreshes via polling
    And the newly shared room appears in the unassigned consultations list without requiring manual page reload

  Scenario: Teacher views and navigates between multiple shared rooms from the same student
    Given a student who has shared both "Thread 1" and "Thread 2"
    When the teacher inspects the shared consultations
    Then both "Thread 1" and "Thread 2" appear as separate, independently joinable rooms
    And claiming or interacting with "Thread 1" does not affect the independent availability of "Thread 2"
