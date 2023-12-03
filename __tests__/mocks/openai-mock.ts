import { mock } from 'bun:test';
import { AgentFunction } from 'src/agents/function';
import { deepClone } from 'src/utils';

export const CREATE_AND_RUN_RESPONSE = {
  id: 'run-123',
  thread_id: 'thread-123',
};
export type ICreateAndRunResponse = typeof CREATE_AND_RUN_RESPONSE;

export const RETRIEVE_RUN_RESPONSE = {
  status: 'completed',
  last_error: { message: undefined }, // Change mock when error is needed to be tested
};
export type IRetrieveRunResponse = typeof RETRIEVE_RUN_RESPONSE;

export const NEED_ACTION_RUN_RESPONSE = {
  ...RETRIEVE_RUN_RESPONSE,
  required_action: {
    submit_tool_outputs: {
      tool_calls: [
        {
          id: 'tool-123',
          function: {
            name: 'test',
            arguments: JSON.stringify({ name: 'John Doe', age: 30 }),
          },
        },
      ],
    },
  },
};
export type INeedActionRunResponse = typeof NEED_ACTION_RUN_RESPONSE;

export const MESSAGE_LIST_RESPONSE = {
  data: [{ content: [{ text: { value: 'TEST' } }] }],
};
export type IMessageListResponse = typeof MESSAGE_LIST_RESPONSE;

export const OUTPUT_TOOL_RESPONSE = {
  tool_calls: [
    {
      function: {
        name: 'test',
        arguments: JSON.stringify({ name: 'John Doe', age: 30 }),
      },
    },
  ],
};
export type IOutputToolResponse = typeof OUTPUT_TOOL_RESPONSE;

export const mockOpenAIRun = () => ({
  required_action: { submit_tool_outputs: OUTPUT_TOOL_RESPONSE },
});

export const mockOpenAI = () => ({
  beta: {
    threads: {
      createAndRun: mock(() =>
        deepClone<ICreateAndRunResponse>(CREATE_AND_RUN_RESPONSE)
      ),

      messages: {
        list: mock(() =>
          deepClone<IMessageListResponse>(MESSAGE_LIST_RESPONSE)
        ),
      },

      runs: {
        retrieve: mock(() =>
          deepClone<IRetrieveRunResponse>(RETRIEVE_RUN_RESPONSE)
        ),
        submitToolOutputs: mock(() => deepClone(OUTPUT_TOOL_RESPONSE)),
      },
    },
  },
});

export class MockFunction extends AgentFunction {
  constructor() {
    super({
      name: 'test',
      description: 'test',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', required: true, description: 'test' },
          age: { type: 'number', required: true, description: 'test' },
        },
      },
    });
  }

  async execute(args: object[]): Promise<any> {
    return mock(() => ({}));
  }
}

export const mockFunction = () => new MockFunction();

export const MockSnsHandler = {
  send: mock(async () => ({})),
};
