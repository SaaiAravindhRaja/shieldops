import { NextRequest } from "next/server";
import { executeMcpTool, type McpToolCall } from "@/lib/mcp-engine";

export const dynamic = "force-dynamic";

/**
 * POST /api/simulate
 *
 * Executes a real MCP tool call and returns the result with
 * protocol-level detail. The frontend sends tool calls one-by-one
 * as the simulation progresses, making each step REAL.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { server, tool, params } = body as McpToolCall;

    if (!server || !tool) {
      return Response.json(
        { error: "Missing server or tool" },
        { status: 400 },
      );
    }

    const result = await executeMcpTool({ server, tool, params: params || {} });

    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: "tool_execution_failed", message: String(err) },
      { status: 500 },
    );
  }
}
