import { SNSHandler } from '@coaktion/aws';

import { AgentFunction } from './function';
import { InternalError } from '../errors';
import { SnsPublishFunctionOptions } from '../types/function';

export class SnsPublishFunction extends AgentFunction {
  protected handler: SNSHandler;
  protected topicArn: string;

  private static guardSnsOptions({ sns }: SnsPublishFunctionOptions) {
    InternalError.notEmptyObject(sns?.handler, 'SNS handler is required');
    InternalError.notEmpty(sns?.topicArn, 'SNS topic ARN is required');
  }

  private static guardFunctionName(name: string) {
    InternalError.guard(
      name.startsWith('cloud.'),
      'Function name must start with "cloud."'
    );
  }

  constructor(opts: SnsPublishFunctionOptions) {
    SnsPublishFunction.guardFunctionName(opts.name);
    SnsPublishFunction.guardSnsOptions(opts);

    super(opts);

    this.handler = opts.sns.handler;
    this.topicArn = opts.sns.topicArn;
  }

  get sns() {
    return this.handler;
  }

  async execute<R = object>(args: R): Promise<boolean> {
    try {
      const functionToExec = this.name.replace('cloud.', '');

      await this.sns.publish({
        topicArn: this.topicArn,
        message: args,
        messageGroupId: `AgentFunction_${functionToExec}`,
        messageAttributes: {
          function: functionToExec,
        },
      });

      return true;
    } catch (error: any) {
      console.error(error);
      return false;
    }
  }
}
