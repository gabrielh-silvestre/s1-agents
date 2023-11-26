import OpenAI from 'openai';
import { AgentFunction } from '..';

export type Agent = {
  complet(msg: string): Promise<string | null>;
};

export type RequiredAgentOptions = {
  agentId: string;
};

export type OptionalAgentOptions = {
  openai?: OpenAI;
  functions?: AgentFunction[];
  log?: boolean;
  poolingInterval?: number; // in milliseconds
};

export type AgentOptions = RequiredAgentOptions & OptionalAgentOptions;

export type AgentProps = Omit<Required<AgentOptions>, 'functions'> & {
  functions: Map<string, AgentFunction>;
};
