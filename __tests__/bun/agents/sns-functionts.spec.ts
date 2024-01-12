import {
  Mock,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  spyOn,
} from 'bun:test';
import { PublishCommand } from '@aws-sdk/client-sns';

import { SnsPublishFunction } from 'src/agents/sns-function';
import { GuardError } from 'src/errors/guard-error';

import { MockSnsHandler } from '__tests__/mocks/openai-mock';

const TOPIC_ARN = 'arn:aws:sns:us-east-1:000000000000:TestTopic';

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

      sns: { topicArn: TOPIC_ARN },
    });
  }
}

describe('[Unit] Tests for SnsPublishFunction', () => {
  let fn: TestSnsFunction;

  let spySnsPublish: Mock<any>;

  beforeEach(() => {
    fn = new TestSnsFunction();

    spySnsPublish = spyOn(MockSnsHandler, 'send');
  });

  afterEach(() => {
    TestSnsFunction.reset();
  });

  it('should create an SNS publish function', () => {
    expect(fn).toBeDefined();
    expect(TestSnsFunction.getFunctions()).toHaveLength(1);
  });

  it('should execute an SNS publish function', async () => {
    const content = { foo: 'bar' };

    const response = await fn.execute(content);

    expect(response).toBeTruthy();
    expect(spySnsPublish).toHaveBeenCalledTimes(1);
    expect(spySnsPublish.mock.calls[0][0]).toBeInstanceOf(PublishCommand);
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
