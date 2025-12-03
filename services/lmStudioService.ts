import { ApiError, ChatCompletionResponse, Model, Message, ChatCompletionChunk } from '../types';

export const fetchModels = async (baseUrl: string): Promise<Model[]> => {
  try {
    const cleanUrl = baseUrl.replace(/\/$/, '');
    const response = await fetch(`${cleanUrl}/v1/models`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch models. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching models:", error);
    throw error;
  }
};

export const sendMessageStream = async (
  baseUrl: string,
  modelId: string,
  messages: Message[],
  onChunk: (content: string) => void
): Promise<void> => {
  const cleanUrl = baseUrl.replace(/\/$/, '');
  
  // Prepare messages for OpenAI Vision API format
  const apiMessages = messages.map(({ role, content, images }) => {
    if (images && images.length > 0) {
      return {
        role,
        content: [
          { type: "text", text: content },
          ...images.map(img => ({
            type: "image_url",
            image_url: { url: img }
          }))
        ]
      };
    }
    return { role, content };
  });

  try {
    const response = await fetch(`${cleanUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: apiMessages,
        stream: true, // Enable streaming
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as ApiError).error?.message || `API Error: ${response.status}`);
    }

    if (!response.body) throw new Error("ReadableStream not supported in this browser.");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep the incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === "data: [DONE]") return;
        if (trimmed.startsWith("data: ")) {
          try {
            const json: ChatCompletionChunk = JSON.parse(trimmed.slice(6));
            const content = json.choices[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            console.warn("Error parsing stream chunk", e);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// Keep the non-streaming version for fallback if needed, though App.tsx will use stream
export const sendMessage = async (
  baseUrl: string,
  modelId: string,
  messages: Message[]
): Promise<ChatCompletionResponse> => {
  const cleanUrl = baseUrl.replace(/\/$/, '');
  
  const apiMessages = messages.map(({ role, content, images }) => {
    if (images && images.length > 0) {
      return {
        role,
        content: [
          { type: "text", text: content },
          ...images.map(img => ({
            type: "image_url",
            image_url: { url: img }
          }))
        ]
      };
    }
    return { role, content };
  });

  try {
    const response = await fetch(`${cleanUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: apiMessages,
        stream: false,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as ApiError).error?.message || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};