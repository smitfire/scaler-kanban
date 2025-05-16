import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Initialize Anthropic client outside the handler for potential reuse
let anthropic;
if (ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
  });
} else {
  console.warn('ANTHROPIC_API_KEY is not set. The function will not work.');
}

// Basic prompt - this will likely need significant refinement for good results.
const createPrompt = (text) => {
  // Note: The structure here (id, parentId, isSubtask) should align with what App.vue expects (camelCase)
  // after Supabase-to-camelCase conversion. The function will handle camelCase to Supabase (snake_case) later.
  return `Human: You are a helpful assistant that converts unstructured text into a structured list of Kanban tickets.
Parse the following text and generate a JSON array of ticket objects. Each ticket object should have the following fields if the information is available:
- id: (string, optional, can be generated if not present)
- title: (string, required, concise summary of the task)
- description: (string, optional, detailed description)
- status: (string, default to "todo". Options: "todo", "inProgress", "done")
- category: (string, optional, e.g., "Global Terminology", "Supply Partners", "Supply Packages", "General", "Branding", "Frontend", "Backend", "Infrastructure", etc. Infer if possible.)
- section: (string, optional, e.g., "Main Table Screen", "Edit Drawer", "Global Changes", etc. Infer if possible.)
- isSubtask: (boolean, true if this is a subtask of another ticket in the provided text)
- parentId: (string, optional, the ID of the parent ticket if isSubtask is true. Ensure this ID matches an ID of another ticket generated from this same text block.)

IMPORTANT:
- If a task seems to be a sub-task of another task mentioned in the text, set isSubtask to true and try to infer the parentId from another task in the input text. You might need to assign temporary IDs to parent tasks first if they are not explicitly given.
- If no parent task is obvious from the text, parentId should be null and isSubtask should be false.
- The output MUST be a valid JSON array of ticket objects. Do not include any other text or explanation outside the JSON array itself.
- If you generate IDs, ensure they are unique within the generated list.

Here is the text to parse:
---
${text}
---

Assistant: [
`; // Note the opening bracket for the JSON array, Claude might complete it better this way.
};

export const handler = async (event) => {
  if (!anthropic) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Anthropic API key not configured. Cannot process request.' }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  const rawText = body.text;
  if (!rawText || typeof rawText !== 'string' || rawText.trim() === '') {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No text provided or text is empty' }),
    };
  }

  const prompt = createPrompt(rawText);

  try {
    const completion = await anthropic.completions.create({
      model: 'claude-2.1', // Or your preferred Claude model, e.g., claude-3-opus-20240229 for more power
      max_tokens_to_sample: 4000, // Adjust as needed, depends on expected output size
      prompt: prompt,
      temperature: 0.3, // Lower temperature for more deterministic, structured output
      stop_sequences: ["\n\nHuman:", "]"], // Stop before it starts a new Human turn, or at the end of the array
    });

    let generatedJsonString = completion.completion;
    // Anthropic might not always close the JSON array if it hits a stop sequence, so we try to fix it.
    if (!generatedJsonString.trim().endsWith(']')) {
        if (generatedJsonString.trim().endsWith(',')) {
            generatedJsonString = generatedJsonString.trim().slice(0, -1); // remove trailing comma
        }
        generatedJsonString += '\n]';
    }
    // Sometimes the model might just output the content of the array without the leading [
    if (!generatedJsonString.trim().startsWith('[')){
        generatedJsonString = '[' + generatedJsonString;
    }

    // console.log("Raw AI Output:\n", generatedJsonString);

    let tickets = JSON.parse(generatedJsonString);
    
    // Basic validation and normalization (optional, but recommended)
    tickets = tickets.map(ticket => ({
        id: ticket.id, // || uuidv4(), // generate UUID if not provided by LLM, requires uuid library
        title: ticket.title || 'Untitled Ticket',
        description: ticket.description || '',
        status: ticket.status || 'todo',
        category: ticket.category || 'General',
        section: ticket.section || '',
        isSubtask: ticket.isSubtask || false,
        parentId: ticket.parentId || null,
        // No need to set createdAt/updatedAt, Supabase/App.vue handles this
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ tickets }),
    };

  } catch (error) {
    console.error('Error calling Anthropic API or parsing response:', error);
    let errorMessage = 'Failed to generate tickets from text.';
    if (error.response && error.response.data && error.response.data.error && error.response.data.error.message) {
      errorMessage = error.response.data.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage, details: error.toString() }),
    };
  }
}; 