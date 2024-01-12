import { ClientOptions, OpenAI } from 'openai';
import { AgentFunction } from '..';

export type Agent = {
  complet(msg: string): Promise<string | null>;
};

export type RequiredAgentOptions = {
  agentId: string;
};

export type OptionalAgentOptions = {
  /**
   * The OpenAI instance configuration.
   * @see https://github.com/openai/openai-node?tab=readme-ov-file#usage
  */
  openai?: ClientOptions;
  functions?: AgentFunction[];
  log?: boolean;
  poolingInterval?: number; // in milliseconds
};

export type AgentOptions = RequiredAgentOptions & OptionalAgentOptions;

export type AgentProps = Omit<Required<AgentOptions>, 'functions' | 'openai'> & {
  functions: Map<string, AgentFunction>;
  openai: OpenAI;
};
