import { afterEach, beforeEach, jest, mock } from 'bun:test';

import SNS from '@aws-sdk/client-sns';
import OpenAI from 'openai';

import { MockSnsHandler, mockOpenAI } from '__tests__/mocks/openai-mock';

beforeEach(() => {
  mock.module('@aws-sdk/client-sns', () => ({
    ...SNS,
    SNSClient: mock(() => MockSnsHandler),
  }));

  mock.module('openai', () => ({
    ...OpenAI,
    OpenAI: mock(() => mockOpenAI()),
  }));
});

afterEach(() => {
  jest.restoreAllMocks();
})
