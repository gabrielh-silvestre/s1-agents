import {
  Mock,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  spyOn,
} from 'bun:test';

import { AgentOpenAI } from 'src/agents/base-agent';
import { GuardError } from 'src/errors/guard-error';

import {
  MESSAGE_LIST_RESPONSE,
  OUTPUT_TOOL_RESPONSE,
  RETRIEVE_RUN_RESPONSE,
  mockFunction,
  mockOpenAI,
  mockOpenAIRun,
} from '__tests__/mocks/openai-mock';
import { Run } from 'openai/resources/beta/threads/runs/runs';

class TestAgent extends AgentOpenAI {
  // @ts-ignore
  public async *treatAction(run: Run) {
    for await (const output of super.treatAction(run)) {
      yield output;
    }
  }

  // @ts-ignore
  public async executeFunction(name: string, args: any) {
    return super.executeFunction(name, args);
  }

  // @ts-ignore
  public async poolingRun(threadId: string, runId: string): Promise<Run> {
    return super.poolingRun(threadId, runId);
  }

  // @ts-ignore
  public async createAndRunThread(content: string): Promise<Run> {
    return super.createAndRunThread(content);
  }

  // @ts-ignore
  public async recoverThreadMessage(threadId: string): Promise<string> {
    return super.recoverThreadMessage(threadId);
  }
}

describe('[Unit] test for AngetOpenAI', () => {
  let agent: TestAgent;

  const mockedOpenAI = mockOpenAI();
  const mockedOpenAIRun = mockOpenAIRun();
  const mockedFunction = mockFunction();

  let spyOpenaiCreateAndRun: Mock<any>;
  let spyOpenaiRetrieveRun: Mock<any>;
  let spyOpenaiListMessages: Mock<any>;

  let spyAgentFunction: Mock<any>;

  beforeEach(() => {
    agent = new TestAgent({
      agentId: 'agent-123',
      openai: mockedOpenAI as any,
      functions: [mockedFunction],
    });

    spyOpenaiCreateAndRun = spyOn(agent.openai.beta.threads, 'createAndRun');
    spyOpenaiRetrieveRun = spyOn(agent.openai.beta.threads.runs, 'retrieve');
    spyOpenaiListMessages = spyOn(agent.openai.beta.threads.messages, 'list');

    spyAgentFunction = spyOn(mockedFunction, 'execute');
  });

  it('should create an agent', () => {
    expect(agent).toBeDefined();
  });

  it('should return the openai instance', () => {
    expect(agent.openai).toBeDefined();
  });

  it.each([
    ['agentId', 'empty', ''],
    ['agentId', 'null', null],
    ['agentId', 'undefined', undefined],
    ['openai', 'empty', {}],
    ['poolingInterval', 'zero', 0],
  ])('should throw an error when %s prop is %s', (prop, _, val) => {
    try {
      const options = {
        agentId: 'agent-123',
        openai: mockOpenAI() as any,
        [prop]: val,
      };

      new AgentOpenAI(options);

      expect().fail('should throw an error');
    } catch (error: any) {
      expect(error).toBeInstanceOf(GuardError);
    }
  });

  it('should create and run a thread', async () => {
    const content = 'test';

    const response = await agent.createAndRunThread(content);

    expect(response).toBeDefined();

    expect(spyOpenaiCreateAndRun).toHaveBeenCalledTimes(1);
    expect(spyOpenaiCreateAndRun.mock.calls[0][0]).toEqual({
      assistant_id: agent.props.agentId,
      thread: { messages: [{ role: 'user', content }] },
    });
  });

  it('should pooling a run', async () => {
    const threadId = 'thread-123';
    const runId = 'run-123';

    await agent.poolingRun(threadId, runId);

    expect(spyOpenaiRetrieveRun).toHaveBeenCalledTimes(1);
    expect(spyOpenaiRetrieveRun.mock.calls[0]).toEqual([threadId, runId]);
  });

  it('should throw an error if pooling a run that failed', async () => {
    RETRIEVE_RUN_RESPONSE.status = 'failed';
    RETRIEVE_RUN_RESPONSE.last_error = { message: 'test' };

    const threadId = 'thread-123';
    const runId = 'run-123';

    try {
      await agent.poolingRun(threadId, runId);

      expect().fail('should throw an error');
    } catch (error: any) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toEqual(RETRIEVE_RUN_RESPONSE.last_error.message);
    } finally {
      RETRIEVE_RUN_RESPONSE.status = 'completed';
      RETRIEVE_RUN_RESPONSE.last_error = undefined;
    }
  });

  it('should recover a thread message', async () => {
    const threadId = 'thread-123';

    const response = await agent.recoverThreadMessage(threadId);

    expect(response).toBeDefined();

    expect(spyOpenaiListMessages).toHaveBeenCalledTimes(1);
    expect(spyOpenaiListMessages.mock.calls[0][0]).toEqual(threadId);
  });

  it('should execute a function', async () => {
    await agent.executeFunction('test', { name: 'John Doe', age: 30 });

    expect(spyAgentFunction).toHaveBeenCalledTimes(1);
    expect(spyAgentFunction.mock.calls[0][0]).toEqual({
      name: 'John Doe',
      age: 30,
    });
  });

  it('should throw an error when function not found', async () => {
    const functionName = 'not-found';

    try {
      await agent.executeFunction(functionName, {});

      expect().fail('should throw an error');
    } catch (error: any) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toInclude(functionName);
    }
  });

  it.only('should treat a action', async () => {
    let executedCount = 0;

    for await (const action of agent.treatAction(mockedOpenAIRun as any)) {
      executedCount += 1;
      expect(action).toBeDefined();
    }

    expect(executedCount).toEqual(OUTPUT_TOOL_RESPONSE.tool_calls.length);
  });

  it('should complete a action', async () => {
    const response = await agent.complet('Olá mundo!');

    expect(response).toBeDefined();
    expect(typeof response).toEqual('string');

    expect(spyOpenaiCreateAndRun).toHaveBeenCalled();
    expect(spyOpenaiRetrieveRun).toHaveBeenCalled();
    expect(spyOpenaiListMessages).toHaveBeenCalled();
  });
});