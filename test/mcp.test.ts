import { describe, it, expect } from 'vitest';
import { createMaxisterMcpServer } from '../src/mcp/server';
import path from 'path';

const rootPath = path.resolve(__dirname, '../../');

describe('Feature 5: Model Context Protocol (MCP) Server', () => {
  it('Scenario 1: Expose standard MCP tools', () => {
    const { server, tools } = createMaxisterMcpServer(rootPath);
    expect(server).toBeDefined();
    expect(tools.length).toBeGreaterThanOrEqual(4);

    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toContain('get_academy_curriculum');
    expect(toolNames).toContain('get_lesson_content');
    expect(toolNames).toContain('get_student_memory');
    expect(toolNames).toContain('update_student_progress');
  });

  it('Scenario 2: Call get_lesson_content tool via MCP handler', async () => {
    const { handleToolCall } = createMaxisterMcpServer(rootPath);

    const result = await handleToolCall('get_lesson_content', {
      courseId: 'para-no-programadores',
      lessonNumber: 1,
    });

    expect(result).toBeDefined();
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('para-no-programadores');
    expect(result.content[0].text).toContain('"lessonNumber": 1');
  });
});
