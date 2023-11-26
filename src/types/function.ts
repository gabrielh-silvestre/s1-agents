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
    type: string;
    /**
     * The properties of the parameter.
     */
    properties: OpenaiFunctionParameters;
  };

  /**
   * The required properties of the function.
   */
  required: string[];
};
