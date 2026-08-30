Feature: Model Context Protocol (MCP) Server Integration
  As a developer using Cursor, VS Code, Antigravity, or Claude Code
  I want to connect to Maxister as an official MCP server
  So that I can access Desde0 curriculum tools and student memory directly inside my editor

  Scenario: Expose standard MCP tools
    Given the Maxister MCP server is initialized
    When a client lists tools
    Then the server returns "get_academy_curriculum", "get_lesson_content", "get_student_memory", and "update_student_progress"

  Scenario: Call get_lesson_content tool via MCP
    Given an MCP client connected over stdio or SSE
    When the client invokes "get_lesson_content" with course "para-no-programadores" and lesson 1
    Then the tool returns structured JSON containing the lesson metadata, phases, and resources
