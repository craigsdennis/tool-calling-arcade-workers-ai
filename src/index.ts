import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();
const SYSTEM_MESSAGE = ``;

class ToolBox {
	env: Env;

	constructor(env: Env) {
		this.env = env;
	}

	async getHighScore() {
		//
		return {success: true, score: 100, initials: "CSD"};
	}

	async addScore({initials, score}: {initials: string, score: number}) {
		// Return what place they are in?
		return {success: true, message: `Added ${initials} with a score of ${score}`};
	}

	hasTool(name: string) {
		return typeof (this as any)[name] === 'function';
	}

	async callTool(name: string, args: {[key: string]: any}) {
		return await (this as any)[name](args);
	}
}


app.post('/api/chat', async(c) => {
	const payload = await c.req.json();
	let tools = JSON.parse(payload.toolsJSON);
	if (tools.length === undefined) {
		tools = [tools];
	}
	console.log("TOOLS", JSON.stringify(tools));
	let messages = [
		{role: "system", content: SYSTEM_MESSAGE},
		{role: "user", content: payload.message}
	];

	const result = await c.env.AI.run(payload.model, {
		messages,
		tools
	});
	// Storing tool_calls
	const toolBox = new ToolBox(c.env);
	const toolCalls = result.tool_calls;
	for (const toolCall of toolCalls) {
		messages.push({
			role: "assistant",
			content: JSON.stringify(toolCall)
		});
		if (toolBox.hasTool(toolCall.name)) {
			const toolResult = await toolBox.callTool(toolCall.name, toolCall.arguments);
			// Add the results
			messages.push({
				role: "tool",
				content: JSON.stringify(toolResult)
			});
		} else {
			messages.push({
				role: "tool",
				content: `Error the tool named ${toolCall.name} was not found`
			});
		}
	}
	// Run again with new tool responses
	const finalResults = await c.env.AI.run(payload.model, {
		messages,
		tools
	});
	console.log({finalResults, messages, toolCalls});
    return c.json({responseMessage: finalResults.response, messages, toolCalls});
});

export default app;
