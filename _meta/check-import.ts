import { getTool } from '@/modules/mcp/tools';
const t = getTool('get_connection_schema');
console.log(JSON.stringify(t?.inputSchema, null, 2));