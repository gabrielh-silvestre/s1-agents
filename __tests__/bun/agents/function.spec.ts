import { beforeEach, describe, expect, it } from 'bun:test';
import fs from 'fs/promises';

import { AgentFunction } from 'src/agents/function';

class TestFunction extends AgentFunction {
  constructor(path?: string) {
    super({
      name: 'test',
      description: 'test',

      parameters: {
        type: 'object',
        properties: {
          foo: { type: 'string', required: true },
        },
      },

      schema: { path, output: !!path },
    });
  }

  async execute(args: object): Promise<any> {
    return args;
  }
}

describe('[Unit] Tests for AgentFunction', () => {
  let fn: TestFunction;

  beforeEach(() => {
    fn = new TestFunction();
  });

  it('should create a function', () => {
    expect(fn).toBeDefined();
    expect(TestFunction.getFunctions()).toHaveLength(1);
  });

  it('should generate an OpenAI schema', async () => {
    const localFn = new TestFunction('.');

    try {
      await localFn.generateOpenaiSchema();

      expect(
        Bun.file(`./${localFn.name}.schema.json`).exists()
      ).resolves.toBeTruthy();
    } finally {
      await fs.rm(`./${localFn.name}.schema.json`);
    }
  });
});
