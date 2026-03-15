import {
  buildNextConversation,
  getAssistantItemsForToolRound,
  getFinalText,
  getToolCalls,
} from "./helper.js";

const MAX_TOOL_STEPS = 10;

const chat = async (conversation) => {
  let currentConversation = conversation;
  let stepsRemaining = MAX_TOOL_STEPS;

  while (stepsRemaining > 0) {
    stepsRemaining -= 1;

    const response = await requestResponse(currentConversation);
    const assistantItems = getAssistantItemsForToolRound(response);
    const toolCalls = getToolCalls(response);

    if (toolCalls.length === 0) {
      return getFinalText(response);
    }

    currentConversation = await buildNextConversation(
      currentConversation,
      assistantItems,
      handlers,
    );
  }

  throw new Error(
    `Tool calling did not finish within ${MAX_TOOL_STEPS} steps.`,
  );
};

const requestResponse = async (input) => {
  const body = buildResponsesRequest({
    model,
    input,
    tools,
  });

  const response = await fetch(RESPONSES_API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_API_KEY}`,
      ...EXTRA_API_HEADERS,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data?.error?.message ?? `Request failed (${response.status})`,
    );
  return data;
};

export default chat;
