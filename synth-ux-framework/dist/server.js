import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { TOOLS } from './tools/definitions.js';
import { handleToolCall } from './handlers/index.js';
export async function startServer() {
    const server = new Server({
        name: 'synth-ux-mcp',
        version: '1.0.0',
    }, {
        capabilities: {
            tools: {},
        },
    });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: TOOLS,
    }));
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        try {
            const result = await handleToolCall(name, args);
            return {
                content: [{ type: 'text', text: result }],
            };
        }
        catch (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Synth-UX MCP Server running');
}
