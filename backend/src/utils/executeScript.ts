import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export interface ScriptResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function executeScript(
  scriptName: string,
  args: Record<string, string> = {},
  timeoutMs = 120000
): Promise<ScriptResult> {
  const scriptsDir = path.join(process.cwd(), '..', 'scripts');
  const scriptPath = path.join(scriptsDir, scriptName);

  const command = `bash "${scriptPath}"`;

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: timeoutMs,
      // Pass args as environment variables directly — no shell interpolation needed
      env: { ...process.env, ...args },
    });
    return { stdout, stderr, exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message || 'Script execution failed',
      exitCode: error.code || 1,
    };
  }
}
