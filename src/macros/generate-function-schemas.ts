import { AgentFunction } from '../agents/function';

async function* main() {
  for (const fn of AgentFunction.getFunctions()) {
    try {
      await fn.generateOpenaiSchema();
      yield null;
    } catch (error) {
      yield `Error generating schema for ${fn.name}: ${error.message}`;
    }
  }

  return null;
}

export const generateFunctionSchemas = async () => {
  for await (const message of main()) {
    if (message) {
      console.log(message);
    }
  }
};
