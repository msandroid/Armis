/**
 * MCP SDK Usage Examples
 */

import { echoTool, addTool, getCurrentTimeTool, reverseStringTool } from './tools/example-tools';

/**
 * Basic tool usage examples
 */
export async function runBasicExamples(): Promise<void> {
  console.log("=== MCP SDK Usage Examples ===");
  
  try {
    // 1. Echo tool usage
    console.log("\n1. Echo tool usage:");
    const echoResult = await echoTool.handler({ message: "Hello, MCP!" });
    console.log(echoResult.content[0].text);

    // 2. Addition tool usage
    console.log("\n2. Addition tool usage:");
    const addResult = await addTool.handler({ a: 10, b: 5 });
    console.log(addResult.content[0].text);

    // 3. Get current time tool usage
    console.log("\n3. Get current time tool usage:");
    const timeResult = await getCurrentTimeTool.handler();
    console.log(timeResult.content[0].text);

    // 4. String reverse tool usage
    console.log("\n4. String reverse tool usage:");
    const reverseResult = await reverseStringTool.handler({ text: "Hello" });
    console.log(reverseResult.content[0].text);

  } catch (error) {
    console.error("An error occurred:", error);
  }
}

/**
 * List available tools
 */
export function listAvailableTools(): void {
  console.log("\n=== Available Tools List ===");
  
  const tools = [echoTool, addTool, getCurrentTimeTool, reverseStringTool];
  
  tools.forEach((tool, index) => {
    console.log(`${index + 1}. ${tool.name}`);
    console.log(`   Description: ${tool.description}`);
    console.log(`   Input Schema:`, tool.inputSchema);
    console.log("");
  });
}

/**
 * Interactive tool execution
 */
export async function runInteractiveExample(): Promise<void> {
  console.log("\n=== Interactive Tool Execution ===");
  
  // In a real application, implement user input handling
  console.log("This example runs tools with predefined parameters");
  
  const examples = [
    { tool: echoTool, args: { message: "Interactive message" } as any },
    { tool: addTool, args: { a: 15, b: 25 } as any },
    { tool: reverseStringTool, args: { text: "Interactive" } as any }
  ];
  
  for (const example of examples) {
    console.log(`\nExecuting: ${example.tool.name}`);
    try {
      const result = await example.tool.handler(example.args);
      console.log(`Result: ${result.content[0].text}`);
    } catch (error) {
      console.error(`Error: ${error}`);
    }
  }
}

/**
 * Error handling examples
 */
export async function runErrorHandlingExample(): Promise<void> {
  console.log("\n=== Error Handling Examples ===");
  
  // Execute with invalid arguments
  try {
    console.log("Executing tool with invalid arguments:");
    await addTool.handler({ a: "invalid", b: 5 } as any);
  } catch (error) {
    console.log("Expected error:", error);
  }
  
  // Call non-existent tool
  try {
    console.log("\nCalling non-existent tool:");
    const nonExistentTool = {
      name: "nonExistent",
      handler: async () => {
        throw new Error("This tool does not exist");
      }
    };
    await nonExistentTool.handler();
  } catch (error) {
    console.log("Expected error:", error);
  }
}

// Main execution function
export async function main(): Promise<void> {
  console.log("Starting MCP SDK usage examples...");
  
  await runBasicExamples();
  listAvailableTools();
  await runInteractiveExample();
  await runErrorHandlingExample();
  
  console.log("\n=== Usage Examples Completed ===");
}

// Direct execution
if (typeof window === 'undefined') {
  main().catch(console.error);
}
