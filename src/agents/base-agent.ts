import { OpenAI } from 'openai';
import { sleep } from 'openai/core';
import { Run } from 'openai/resources/beta/threads/runs/runs';

import { Agent, AgentOptions, AgentProps } from '../types/agent';
import { AgentFunction } from './function';
import { InternalError } from 'src/errors';

export class AgentOpenAI implements Agent {
  private currThreadId: string | null = null;

  protected readonly _props: AgentProps = {
    agentId: '',
    openai: new OpenAI(),
    functions: new Map<string, AgentFunction>(),
    log: false,
    poolingInterval: 2000,
  };

  private static guardProps(props: AgentProps) {
    const { agentId, poolingInterval } = props;

    InternalError.notEmpty(agentId, 'Agent ID is required');
    InternalError.notEmptyObject(props.openai, 'OpenAI instance is required');

    const isPoolingIntervalValid = !!poolingInterval && poolingInterval > 500;
    InternalError.guard(
      isPoolingIntervalValid,
      'Pooling interval must be greater than 500ms'
    );
  }

  private guardFunctions({ functions }: AgentOptions) {
    const hasAnyFunction = functions?.length > 0;
    if (!hasAnyFunction) return;

    InternalError.duplicatedArray(
      functions?.map((fn) => fn.name),
      'Functions must have unique names'
    );

    const invalidFunction = functions?.find(
      (fn) => !(fn instanceof AgentFunction)
    );
    InternalError.guard(
      !invalidFunction,
      `Function "${invalidFunction?.name}" is invalid`
    );
  }

  constructor(opts: AgentOptions) {
    this._props.agentId = opts.agentId;
    this._props.log = opts.log ?? this._props.log;
    this._props.poolingInterval =
      opts.poolingInterval ?? this._props.poolingInterval;
    this._props.openai = opts.openai ?? this._props.openai;

    this.guardFunctions(opts);

    for (const fn of opts.functions ?? []) {
      if (!fn) continue;
      this._props.functions.set(fn.name, fn);
    }

    AgentOpenAI.guardProps(this._props);
  }

  get openai() {
    return this._props.openai;
  }

  get props() {
    return this._props;
  }

  /**
   * @description
   * Get the current thread ID
   * For default, the thread ID is stored in the instance and only persists while the instance is alive. (while it is in memory)
   * 
   * If you want to persist the thread ID, you can override this getter and setter.
   * 
   * @returns {string | null}
   */
  get threadId(): string | null {
    return this.currThreadId;
  }

  /**
   * @description
   * Set the current thread ID
   * For default, the thread ID is stored in the instance and only persists while the instance is alive. (while it is in memory)
   * 
   * If you want to persist the thread ID in other place, you can override this getter and setter.
   * 
   * @param {string} id
   */
  protected set threadId(id: string) {
    this.currThreadId = id;
  }

  protected async *treatAction(run: Run) {
    const tools = run.required_action?.submit_tool_outputs.tool_calls ?? [];

    for (const tool of tools) {
      const { name, arguments: args } = tool.function;
      const output = await this.executeFunction(name, JSON.parse(args));

      yield { tool_call_id: tool.id, output };
    }
  }

  protected async executeFunction(name: string, args: object[]) {
    const fn = this._props.functions.get(name);
    if (!fn) return null;

    return await fn.execute(args);
  }

  protected async poolingRun(runId: string): Promise<Run> {
    const response = await this.openai.beta.threads.runs.retrieve(
      this.threadId,
      runId
    );

    if (response.status === 'requires_action') {
      let toolOutputs: any[] = [];

      for await (const result of this.treatAction(response)) {
        toolOutputs.push(result);
      }

      await this.openai.beta.threads.runs.submitToolOutputs(this.threadId, runId, {
        tool_outputs: toolOutputs,
      });
    }

    const isFinished =
      response.status === 'cancelled' ||
      response.status === 'completed' ||
      response.status === 'failed';
    if (!isFinished) {
      await sleep(this._props.poolingInterval);
      return await this.poolingRun(runId);
    }

    const hadSuccess = response.status === 'completed';
    if (!hadSuccess) throw new Error(response.last_error?.message);

    return response;
  }

  protected async createAndRunThread(content: string) {
    const response = await this.openai.beta.threads.createAndRun({
      assistant_id: this._props.agentId,
      thread: {
        messages: [{ role: 'user', content }],
      },
    });

    this.threadId = response.thread_id;

    return response;
  }

  protected async updateThread(content: string) {
    await this.openai.beta.threads.messages.create(
      this.threadId,
      { role: 'user', content }
    );

    return await this.openai.beta.threads.runs.create(this.threadId, {
      assistant_id: this._props.agentId,
    });
  }

  protected async recoverThreadMessage(): Promise<string> {
    const response = await this.openai.beta.threads.messages.list(this.threadId);

    return response.data.flatMap((r) =>
      r.content?.map((c) => (c as any)?.text?.value)
    )[0];
  }

  async complet(msg: string): Promise<string | null> {
    const { id } = this.currThreadId
      ? await this.updateThread(msg)
      : await this.createAndRunThread(msg);

    await this.poolingRun(id);
    const response = await this.recoverThreadMessage();

    if (!response) return null;
    return response;
  }
}
