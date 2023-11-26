# s1-agents

## Installation

### Requirements

- Bun 1.0.14^

### Install

```bash
bun add s1-agents
```

```bash
npm install s1-agents
```

## Usage

```ts
import { AgentOpenAI, AgentFuncion } from 's1-agents';
import { Macros } from 's1-agents' assert { type: 'macro' };

class GenerateRandomNumber extends AgentFuncion {
  constructor() {
    super({
      name: 'random-number',
      description: 'Generate a random number between the given range',
      parameters: {
        type: 'object',
        properties: {
          min: {
            type: 'number',
            required: true,
            description: 'The minimum number to generate',
          },
          max: {
            type: 'number',
            required: true,
            description: 'The maximum number to generate',
          },
        },

        schema: { output: true, path: '.' },
        log: true,
      },
    });
  }

  async execute(args: object) {
    const { min, max } = args as any;
    const random = Math.floor(Math.random() * (max - min + 1)) + min;
    return random;
  }
}

const agent = new AgentOpenAI({
  agentId: '<openai_assistant_id>',
  functions: [new GenerateRandomNumber()],
});

// Optional, will generate a JSON file with the schemas of the functions to register into OpenAI Assistant
await Macros.generateFunctionSchemas();

const response = await agent.complet(
  'Generate a random number between 1 and 100'
);
console.log(response);
```
