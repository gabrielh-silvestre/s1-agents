import { SNSClientConfig } from '@aws-sdk/client-sns';

export type IFunction = {
  execute(args: object): Promise<any>;
};

export type FunctionParameters = {
  type: string;
  description?: string;
  enum?: string[];
  required: boolean;
};

export type RequiredFunctionOptions = {
  name: string;
  description: string;

  parameters: {
    type: 'object';
    properties: Record<string, FunctionParameters>;
  };
};

export type OptionalFunctionOptions = {
  log?: boolean;

  schema?: {
    path?: string;
    output?: boolean;
  };
};

export type FunctionOptions = RequiredFunctionOptions & OptionalFunctionOptions;

export type OpenaiFunctionParameters = {
  type: string;
  properties: Record<string, Omit<FunctionParameters, 'required'>>;
};

/**
 * Represents the schema for an OpenAI function.
 */
export type OpenaiFunctionSchema = {
  /**
   * The name of the function.
   */
  name: string;
  /**
   * The description of the function.
   */
  description: string;

  /**
   * The parameters of the function.
   */
  parameters: {
    /**
     * The type of the parameter.
     */
    type: 'object';
    /**
     * The properties of the parameter.
     */
    properties: Record<string, Omit<FunctionParameters, 'required'>>;

    /**
     * The required properties of the function.
     */
    required: string[];
  };
};

/**
 * Options for an SNS publish function.
 *
 * @argument name The name of the function. Should start with "cloud.".
 */
export type SnsPublishFunctionOptions = FunctionOptions & {
  sns: {
    /**
     * The SNS client configuration.
     * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-sns/interfaces/snsclientconfig.html
     */
    client?: SNSClientConfig;
    /**
     * The ARN (Amazon Resource Name) of the SNS topic.
     */
    topicArn: string;
  };
};
