import { execSync } from 'child_process';

import { DEFAULT_LLM_MODEL_NAME, DEFAULT_LLM_PROVIDER } from '../constants';
const minimist = require('minimist');

export function findNpxPath(): string {
  try {
    // Try to find npx using 'which' on Unix-like systems or 'where' on Windows
    const isWin = process.platform === 'win32';
    const command = isWin ? 'where npx.cmd' : 'which npx';
    const npxPath = execSync(command, { encoding: 'utf8' }).trim();
    const firstPath = npxPath.split('\n')[0]; // Take the first result if multiple paths
    return isWin ? `cmd.exe /c ${firstPath}` : firstPath;
  } catch (error) {
    console.error(
      '❌ npx not found in PATH. Please install Node.js and npm to get npx:',
      error,
    );
    process.exit(1);
  }
}

export function parseArgs(
  usage: string,
  opts?: {
    skipPrompt?: boolean;
  },
): {
  prompt: string;
  modelName: string;
  provider: string;
  apiKey: string;
  stream: boolean;
  port: number;
} {
  const argv = minimist(process.argv.slice(2));

  if (argv.help) {
    console.log(usage);
    process.exit(0);
  }

  const prompt = argv._?.join(' ') || '';
  const modelName = argv.modelName || DEFAULT_LLM_MODEL_NAME;
  const provider = argv.provider || DEFAULT_LLM_PROVIDER;
  const apiKey = process.env.INWORLD_API_KEY || '';
  const stream = argv.stream !== 'false';
  const port = argv.port || 8080;

  if (!prompt && !opts?.skipPrompt) {
    throw new Error(`You need to provide a prompt.\n${usage}`);
  }

  if (!apiKey) {
    throw new Error(
      `You need to set INWORLD_API_KEY environment variable.\n${usage}`,
    );
  }

  return { prompt, modelName, provider, apiKey, stream, port };
}
