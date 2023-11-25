import { OpenAI } from 'openai';
import { sleep } from 'openai/core';
import { Run } from 'openai/resources/beta/threads/runs/runs';

import { Agent, AgentOptions, AgentProps } from '../types/agent';
import { AgentFunction } from './function';
import { GuardError } from '../errors/guard-error';

export class AgentOpenAI implements Agent {
  protected readonly _props: AgentProps = {
    agentId: '',
    openai: new OpenAI(),
    functions: new Map<string, AgentFunction>(),
    log: false,
    poolingInterval: 2000,
  };

  private static guardProps(props: AgentProps) {
    const { agentId, poolingInterval } = props;

    const isAgentIdValid = typeof agentId === 'string' && agentId.length > 0;
    GuardError.guard(isAgentIdValid, 'Agent ID is required');

    const isPoolingIntervalValid = !!poolingInterval && poolingInterval > 500;
    GuardError.guard(
      isPoolingIntervalValid,
      'Pooling interval must be greater than 500ms'
    );

    const isOpenAIValid =
      !!props.openai && Object.keys(props.openai).length > 0;
    GuardError.guard(isOpenAIValid, 'OpenAI instance is required');
  }

  constructor(opts: AgentOptions) {
    this._props.agentId = opts.agentId;
    this._props.log = opts.log ?? this._props.log;
    this._props.poolingInterval =
      opts.poolingInterval ?? this._props.poolingInterval;
    this._props.openai = opts.openai ?? this._props.openai;

    for (const fn of opts.functions ?? []) {
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
    if (!fn) throw new Error(`Function ${name} not found`);

    return await fn.execute(args);
  }

  protected async poolingRun(threadId: string, runId: string): Promise<Run> {
    const response = await this.openai.beta.threads.runs.retrieve(
      threadId,
      runId
    );

    if (response.status === 'requires_action') {
      let toolOutputs: any[] = [];

      for await (const result of this.treatAction(response)) {
        toolOutputs.push(result);
      }

      await this.openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
        tool_outputs: toolOutputs,
      });
    }

    const isFinished =
      response.status === 'cancelled' ||
      response.status === 'completed' ||
      response.status === 'failed';
    if (!isFinished) {
      await sleep(this._props.poolingInterval);
      return await this.poolingRun(threadId, runId);
    }

    const hadSuccess = response.status === 'completed';
    if (!hadSuccess) throw new Error(response.last_error?.message);

    return response;
  }

  protected async createAndRunThread(content: string) {
    return await this.openai.beta.threads.createAndRun({
      assistant_id: this._props.agentId,
      thread: {
        messages: [{ role: 'user', content }],
      },
    });
  }

  protected async recoverThreadMessage(threadId: string): Promise<string> {
    const response = await this.openai.beta.threads.messages.list(threadId);

    return response.data.flatMap((r) =>
      r.content?.map((c) => (c as any)?.text?.value)
    )[0];
  }

  async complet(msg: string): Promise<string | null> {
    const { thread_id, id } = await this.createAndRunThread(msg);

    const completedRun = await this.poolingRun(thread_id, id);
    const response = await this.recoverThreadMessage(completedRun.thread_id);

    if (!response) return null;
    return response;
  }
}