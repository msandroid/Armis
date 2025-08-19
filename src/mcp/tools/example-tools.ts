/**
 * MCP Tools Implementation Examples
 */

/**
 * Echo Tool
 * Returns the input message as is
 */
export const echoTool = {
  name: "echo",
  description: "Tool to echo a message",
  inputSchema: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "Message to echo"
      }
    },
    required: ["message"]
  },
  handler: async (args: { message: string }) => {
    return {
      content: [{
        type: "text",
        text: `Echo: ${args.message}`
      }]
    };
  }
};

/**
 * Addition Tool
 * Adds two numbers
 */
export const addTool = {
  name: "add",
  description: "Tool to add two numbers",
  inputSchema: {
    type: "object",
    properties: {
      a: {
        type: "number",
        description: "First number"
      },
      b: {
        type: "number",
        description: "Second number"
      }
    },
    required: ["a", "b"]
  },
  handler: async (args: { a: number; b: number }) => {
    const result = args.a + args.b;
    return {
      content: [{
        type: "text",
        text: `${args.a} + ${args.b} = ${result}`
      }]
    };
  }
};

/**
 * Get Current Time Tool
 * Gets the current date and time
 */
export const getCurrentTimeTool = {
  name: "getCurrentTime",
  description: "Tool to get current time",
  inputSchema: {
    type: "object",
    properties: {}
  },
  handler: async () => {
    const now = new Date();
    return {
      content: [{
        type: "text",
        text: `Current time: ${now.toLocaleString('en-US')}`
      }]
    };
  }
};

/**
 * String Reverse Tool
 * Reverses the input string
 */
export const reverseStringTool = {
  name: "reverseString",
  description: "Tool to reverse a string",
  inputSchema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "String to reverse"
      }
    },
    required: ["text"]
  },
  handler: async (args: { text: string }) => {
    const reversed = args.text.split('').reverse().join('');
    return {
      content: [{
        type: "text",
        text: `Reversed result: ${reversed}`
      }]
    };
  }
};

/**
 * List of available tools
 */
export const availableTools = [
  echoTool,
  addTool,
  getCurrentTimeTool,
  reverseStringTool
];
