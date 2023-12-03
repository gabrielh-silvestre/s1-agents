import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

import { AgentFunction } from './function';
import { InternalError } from '../errors';
import { SnsPublishFunctionOptions } from '../types/function';

export class SnsPublishFunction extends AgentFunction {
  protected handler: SNSClient;
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

  private prepareMessage(args: any) {
    const functionToExec = this.name.replace('cloud.', '');

    return new PublishCommand({
      Message: args,
      TopicArn: this.topicArn,

      MessageGroupId: `AgentFunction_${functionToExec}`,
      MessageAttributes: {
        function: {
          DataType: 'String',
          StringValue: functionToExec,
        },
      },
    });
  }

  async execute<R = object>(args: R): Promise<boolean> {
    try {
      const msg = this.prepareMessage(args);
      await this.sns.send(msg);

      return true;
    } catch (error: any) {
      console.error(error);
      return false;
    }
  }
}
