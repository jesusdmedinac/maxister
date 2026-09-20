# Maxister MVP - Development Progress

---

## 📚 Feature 1: Knowledge Ingestion & Curriculum Parser (`knowledge_ingestion.feature`)
- [x] Scenario: List available courses and curriculum metadata
- [x] Scenario: Parse structured 5-phase lesson content from MDX
- [x] Scenario: Search knowledge base for specific topics or errors

## 🧠 Feature 2: Student Profile & Persistent Memory (`student_memory.feature`)
- [x] Scenario: Create and retrieve a student profile
- [x] Scenario: Update lesson progress and record mastered skills
- [x] Scenario: Record struggling concepts and persistent tutor notes

## 🤖 Feature 3: Socratic AI Tutor Agent (`socratic_agent.feature`)
- [x] Scenario: Inquire with contextual student and lesson grounding
- [x] Scenario: Request help on a coding challenge without receiving full solution
- [x] Scenario: Interactive debugging guidance for error messages

## 🖥️ Feature 4: Interactive Web Dashboard (`web_dashboard.feature`)
- [x] Scenario: Browse courses and switch active lesson in sidebar
- [x] Scenario: Real-time interactive chat with streaming and Markdown formatting
- [x] Scenario: Live student profile and skills inspection

## 🔌 Feature 5: Model Context Protocol (MCP) Server (`mcp_server.feature`)
- [x] Scenario: Expose standard MCP tools
- [x] Scenario: Call get_lesson_content tool via MCP

## 🔐 Feature 6: Student Authentication & Human Teacher Escalation (`student_authentication.feature`)
- [x] Scenario: Register a new student account with validation and password hashing
- [x] Scenario: Prevent duplicate account registration with the same email
- [x] Scenario: Log in with valid credentials and issue secure session cookie
- [x] Scenario: Reject login with invalid email or incorrect password
- [x] Scenario: Inspect session state and log out terminating session
- [x] Scenario: Authenticated student creates a shared chat snapshot for the teacher
- [x] Scenario: Human teacher accesses and inspects a shared student chat via unique link

## 🏛️ Feature 7: Teacher Governance & Backoffice Management (`teacher_governance.feature`)
- [x] Scenario: Root admin signs in with credentials from Cloudflare environment variables
- [x] Scenario: Root admin provisions a new verified teacher
- [x] Scenario: Regular student is barred with 403 Forbidden from backoffice
- [x] Scenario: Root admin deactivates a teacher account and revokes active sessions
- [x] Scenario: Root admin manages, qualifies, and blocks entries in TeacherFeedbackStore

## 💬 Feature 8: Multi-Thread Conversation History & 1-to-1 Shared Rooms (`conversation_history.feature`)
- [x] Scenario: Student creates multiple conversation threads and switches between them in sidebar
- [x] Scenario: Student escalates thread into a shared room, automatically transitioning default mode to AI Auto
- [x] Scenario: Teacher views separate sections for personal chats and student shared consultations
- [x] Scenario: Teacher claims room locking it 1-to-1 and reveals AI Mode selector
- [x] Scenario: Assigned teacher releases room; messages persist and room reverts to open claim state

## 🤝 Feature 9: Tripartite Interactive Chat & Strategic Teacher Feedback Memory (`tripartite_chat.feature`)
- [x] Scenario: Single student chat enforces AI On and hides AI Mode selector
- [x] Scenario: In AI Off mode, Maxister listens in the background without generating spoken output
- [x] Scenario: In AI Auto mode, Maxister responds when a participant explicitly refers to it
- [x] Scenario: Maxister automatically detects teacher pedagogical directive, saves it to TeacherFeedbackStore, and displays an explicit badge
- [x] Scenario: Strategic teacher feedback tagged by student, teacher, and course is retrieved and applied in subsequent inquiries

## ⚡ Feature 10: Dynamic In-Place Student Consultation & Teacher Reaction (`dynamic_student_room.feature`)
- [x] Scenario: Student creates a shareable link for the teacher without leaving the main chat view
- [x] Scenario: Main chat dynamically detects teacher arrival and displays teacher presence
- [x] Scenario: Real-time synchronization of teacher messages and feedback directives directly in student chat
- [x] Scenario: Dynamic activation and display of AI participation modes in student chat upon teacher arrival
- [x] Scenario: Dynamic reversion when assigned teacher leaves or releases the consultation

## 🚪 Feature 11: Read-Only Rooms, Smart Role Detection & Unified Teacher History (`room_access_and_teacher_history.feature`)
- [x] Scenario: Unauthenticated guest accesses shared room in read-only mode with unified login action
- [x] Scenario: Authenticated student owner accesses their own room and unlocks student messaging
- [x] Scenario: Authenticated student visitor is restricted with read-only banner
- [x] Scenario: Authenticated teacher connects to unassigned room, sees "Unirse al chat como profesor", and claims it into their unified chat history
- [x] Scenario: Other teachers see assigned teacher banner, and releasing the room preserves the consultation in teacher chat history


