import OpenAI from 'openai';
import { AgentFunction } from '..';

export type Agent = {
  complet(msg: string): Promise<string | null>;
};

/**
 * The RequiredAgentOptions type requires an agentId property of type string.
 * @property {string} agentId - A string representing the unique identifier for an
 * OpenAI Assistant.
 */
export type RequiredAgentOptions = {
  agentId: string;
};

/**
 * The `OptionalAgentOptions` type is an object type that may contain optional properties such as
 * `functions`, `log`, and `poolingInterval`.
 * @property {AgentFunction[]} functions - An array of AgentFunction objects. These objects represent
 * the functions that the agent will execute.
 * @property {boolean} log - The `log` property is a boolean value that determines whether or not to
 * enable logging for the agent. If set to `true`, the agent will log information about its execution.
 * If set to `false` or not provided, logging will be disabled.
 * @property {number} poolingInterval - The `poolingInterval` property is an optional property that
 * specifies the interval at which the agent should perform pooling. It is measured in milliseconds.
 * If not provided, the default value is 2000ms.
 */
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
