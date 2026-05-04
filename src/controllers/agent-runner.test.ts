import { describe, expect, test } from 'bun:test';
import { AgentRunnerController } from './agent-runner.js';
import { InMemoryChatHistory } from '../utils/in-memory-chat-history.js';

describe('AgentRunnerController', () => {
  test('updates the active agent config for subsequent runs', () => {
    const controller = new AgentRunnerController(
      { model: 'gpt-5.4', modelProvider: 'openai', maxIterations: 10 },
      new InMemoryChatHistory('gpt-5.4'),
    );

    controller.updateAgentConfig({
      model: 'ollama:llama3.1',
      modelProvider: 'ollama',
    });

    expect(controller.currentConfig).toMatchObject({
      model: 'ollama:llama3.1',
      modelProvider: 'ollama',
      maxIterations: 10,
    });
  });

  test('tracks and resets stream progress turn stats', async () => {
    const controller = new AgentRunnerController(
      { model: 'gpt-5.4', modelProvider: 'openai', maxIterations: 10 },
      new InMemoryChatHistory('gpt-5.4'),
    );

    (controller as any).turnStartMsValue = 1_000;

    await (controller as any).handleEvent({
      type: 'stream_progress',
      charDelta: 24,
      mode: 'thinking',
    });
    await (controller as any).handleEvent({
      type: 'stream_progress',
      charDelta: 8,
      mode: 'tool-input',
    });

    expect(controller.turnStats).toEqual({
      turnStartMs: 1_000,
      streamedChars: 32,
      streamMode: 'tool-input',
    });

    await (controller as any).handleEvent({
      type: 'done',
      answer: 'done',
      toolCalls: [],
      iterations: 1,
      totalTime: 100,
    });

    expect(controller.turnStats).toBeNull();
  });
});
