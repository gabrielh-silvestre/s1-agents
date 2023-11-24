import { OpenAI } from 'openai';
import { sleep } from 'openai/core';
import { Run } from 'openai/resources/beta/threads/runs/runs';

import { Agent, AgentOptions, AgentProps } from '../types/agent';
import { AgentFunction } from './function';
import { GuardError } from '../errors/guard-error';

export class AgentOpenAI implements Agent {
  protected readonly props: AgentProps = {
    agentId: '',
    functions: new Map<string, AgentFunction>(),
    log: false,
    poolingInterval: 2000,
  };

  openai: OpenAI;

  private static guardProps(props: AgentProps) {
    const { agentId, poolingInterval } = props;

    const isAgentIdValid = typeof agentId === 'string' && agentId.length > 0;
    GuardError.guard(isAgentIdValid, 'Agent ID is required');

    const isPoolingIntervalValid = !!poolingInterval && poolingInterval > 500;
    GuardError.guard(
      isPoolingIntervalValid,
      'Pooling interval must be greater than 500ms'
    );
  }

  constructor(opts: AgentOptions) {
    this.props.agentId = opts.agentId;
    this.props.log = opts.log ?? this.props.log;
    this.props.poolingInterval =
      opts.poolingInterval ?? this.props.poolingInterval;

    for (const fn of opts.functions ?? []) {
      this.props.functions.set(fn.name, fn);
    }

    AgentOpenAI.guardProps(this.props);

    this.openai = new OpenAI();
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
    const fn = this.props.functions.get(name);
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
      await sleep(2000);
      return await this.poolingRun(threadId, runId);
    }

    const hadSuccess = response.status === 'completed';
    if (!hadSuccess) throw new Error(response.last_error?.message);

    return response;
  }

  protected async createAndRunThread(content: string) {
    return await this.openai.beta.threads.createAndRun({
      assistant_id: this.props.agentId,
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
