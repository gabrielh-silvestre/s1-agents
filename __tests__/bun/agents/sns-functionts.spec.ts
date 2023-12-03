import {
  Mock,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  spyOn,
} from 'bun:test';

import { SnsPublishFunction } from 'src/agents/sns-function';
import { GuardError } from 'src/errors/guard-error';

import { MockSnsHandler } from '__tests__/mocks/openai-mock';

class TestSnsFunction extends SnsPublishFunction {
  constructor() {
    super({
      name: 'cloud.test',
      description: 'test',
      parameters: {
        type: 'object',
        properties: {
          foo: { type: 'string', required: true },
        },
      },

      sns: {
        handler: MockSnsHandler as any,
        topicArn: 'arn:aws:sns:us-east-1:000000000000:TestTopic',
      },
    });
  }
}

describe('[Unit] Tests for SnsPublishFunction', () => {
  let fn: TestSnsFunction;

  let spySnsPublish: Mock<any>;

  beforeEach(() => {
    fn = new TestSnsFunction();

    spySnsPublish = spyOn(MockSnsHandler, 'publish');
  });

  afterEach(() => {
    TestSnsFunction.reset();
  });

  it('should create an SNS publish function', () => {
    expect(fn).toBeDefined();
    expect(TestSnsFunction.getFunctions()).toHaveLength(1);
  });

  it('should execute an SNS publish function', async () => {
    const normalizedFnName = fn.name.replace('cloud.', '');
    const content = { foo: 'bar' };

    const response = await fn.execute(content);

    expect(response).toBeTruthy();
    expect(spySnsPublish).toHaveBeenCalledTimes(1);
    expect(spySnsPublish.mock.calls[0][0]).toEqual({
      message: { foo: 'bar' },
      messageGroupId: expect.stringContaining(normalizedFnName),

      topicArn: expect.any(String),
      messageAttributes: {
        function: expect.stringContaining(normalizedFnName),
      },
    });
  });

  it('should throw an error if the function name is invalid', () => {
    try {
      new SnsPublishFunction({
        name: 'test',
        description: 'test',
        parameters: {
          type: 'object',
          properties: {},
        },

        sns: {
          handler: MockSnsHandler as any,
          topicArn: 'arn:aws:sns:us-east-1:000000000000:TestTopic',
        },
      });

      expect().fail('Should have thrown an error');
    } catch (error: any) {
      expect(error).toBeInstanceOf(GuardError);
    }
  });

  it.each([
    ['sns', 'empty', {}],
    ['sns', 'null', null],
    ['sns', 'undefined', undefined],
    ['sns.handler', 'empty', { handler: {} }],
    ['sns.handler', 'null', { handler: null }],
    ['sns.handler', 'undefined', { handler: undefined }],
    ['sns.topicArn', 'empty', { topicArn: '' }],
    ['sns.topicArn', 'null', { topicArn: null }],
    ['sns.topicArn', 'undefined', { topicArn: undefined }],
  ])('should throw an error when %s prop is %s', (prop, _, val) => {
    try {
      const sns: any = val;

      new SnsPublishFunction({
        name: 'cloud.test',
        description: 'test',
        parameters: {
          type: 'object',
          properties: {},
        },

        sns,
      });

      expect().fail('Should have thrown an error');
    } catch (error: any) {
      expect(error).toBeInstanceOf(GuardError);
    }
  });
});
