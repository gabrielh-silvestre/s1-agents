import {
  FunctionOptions,
  IFunction,
  OpenaiFunctionParameters,
  OpenaiFunctionSchema,
  OptionalFunctionOptions,
  RequiredFunctionOptions,
} from '../types/function';

import path from 'path';
import fs from 'fs/promises';

export abstract class AgentFunction implements IFunction {
  name: string;

  schema: OpenaiFunctionSchema;

  protected readonly _props: OptionalFunctionOptions = {
    log: false,
    schemaPath: path.resolve(
      import.meta.dir,
      '../..',
      'dist',
      'openai-functions'
    ),
  };

  static functions: AgentFunction[] = [];

  private static mapOptionsToSchema(
    opts: RequiredFunctionOptions
  ): OpenaiFunctionSchema {
    const { name, description } = opts;

    const properties: OpenaiFunctionParameters = {
      type: 'object',
      properties: opts.parameters.properties,
    };

    return {
      name,
      description,

      parameters: {
        type: 'object',
        properties,
      },

      required: Object.entries(opts.parameters.properties)
        .filter(([_, prop]) => prop.required)
        .flatMap(([key]) => key),
    };
  }

  private static register(fn: AgentFunction): void {
    AgentFunction.functions.push(fn);
  }

  static getFunctions(): AgentFunction[] {
    return AgentFunction.functions;
  }

  constructor(opts: FunctionOptions) {
    this.name = opts.name;
    this.schema = AgentFunction.mapOptionsToSchema(opts);

    this._props.log = opts.log ?? this._props.log;
    this._props.schemaPath = opts.schemaPath ?? this._props.schemaPath;

    AgentFunction.register(this);
  }

  abstract execute(args: object[]): Promise<any>;

  async generateOpenaiSchema(): Promise<void> {
    const schemaPath = path.join(
      this._props.schemaPath,
      `${this.name}.schema.json`
    );
    const schema = JSON.stringify(this.schema, null, 2);

    const directoryAlreadyExists = await Bun.file(schemaPath).exists();
    if (!directoryAlreadyExists) {
      await fs.mkdir(path.dirname(schemaPath), { recursive: true });
    }

    if (this._props.log) console.log(`Writing schema to ${schemaPath}`);

    await Bun.write(schemaPath, schema);
  }
}
