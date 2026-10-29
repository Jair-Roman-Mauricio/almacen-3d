#!/usr/bin/env node
import { access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

const usage = `Cliente local del MCP awwwards-inspiration.

Uso:
  node scripts/awwwards-mcp.mjs list
  node scripts/awwwards-mcp.mjs call <herramienta> '<argumentos JSON>'

Ejemplo:
  node scripts/awwwards-mcp.mjs call search_designs '{"query":"saas","limit":3}'

Variables opcionales:
  AWWWARDS_MCP_ROOT  Carpeta del motor local de inspiración.
  AWWWARDS_MCP_NODE  Ejecutable Node usado para iniciar el servidor.
`;

async function main() {
  const [operation, toolName, rawArguments = '{}', ...extra] = process.argv.slice(2);
  if (!operation || operation === '--help' || operation === '-h') {
    console.log(usage);
    return;
  }
  if (!['list', 'call'].includes(operation) || extra.length ||
      (operation === 'call' && !toolName) || (operation === 'list' && toolName)) {
    throw new Error(usage);
  }

  let toolArguments = {};
  if (operation === 'call') {
    toolArguments = JSON.parse(rawArguments);
    if (!toolArguments || typeof toolArguments !== 'object' || Array.isArray(toolArguments)) {
      throw new Error('Los argumentos deben ser un objeto JSON.');
    }
  }

  const engineRoot = process.env.AWWWARDS_MCP_ROOT ??
    path.join(os.homedir(), 'awwwards-inspiration-engine');
  const serverPath = path.join(engineRoot, 'mcp-server', 'dist', 'index.js');
  await access(serverPath);
  const sdkRequire = createRequire(path.join(engineRoot, 'mcp-server', 'package.json'));
  const { Client } = sdkRequire('@modelcontextprotocol/sdk/client/index.js');
  const { StdioClientTransport } = sdkRequire('@modelcontextprotocol/sdk/client/stdio.js');
  const client = new Client(
    { name: 'almacen-3d-awwwards-client', version: '1.0.0' },
    { capabilities: {} },
  );
  const transport = new StdioClientTransport({
    command: process.env.AWWWARDS_MCP_NODE ?? process.execPath,
    args: [serverPath],
    cwd: engineRoot,
    stderr: 'pipe',
  });
  let serverDiagnostics = '';
  transport.stderr.on('data', chunk => {
    serverDiagnostics = (serverDiagnostics + String(chunk)).slice(-6000);
  });

  try {
    await client.connect(transport, { timeout: 15000 });
    const { tools } = await client.listTools();
    if (operation === 'list') {
      console.log(JSON.stringify({ server: 'awwwards-inspiration', tools }, null, 2));
      return;
    }
    if (!tools.some(tool => tool.name === toolName)) {
      throw new Error(`Herramienta desconocida: ${toolName}. Usa "list" para consultar el catálogo.`);
    }
    const result = await client.callTool(
      { name: toolName, arguments: toolArguments },
      undefined,
      { timeout: 180000 },
    );
    console.log(JSON.stringify(result, null, 2));
    if (result.isError) process.exitCode = 1;
  } catch (error) {
    if (serverDiagnostics) process.stderr.write(serverDiagnostics);
    throw error;
  } finally {
    await client.close();
  }
}

main().catch(error => {
  console.error(`Error del cliente Awwwards MCP: ${error.message}`);
  process.exitCode = 1;
});
