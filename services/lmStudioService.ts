import { ApiError, ChatCompletionResponse, Model, Message } from '../types';

export const fetchModels = async (baseUrl: string): Promise<Model[]> => {
  try {
    // Remove trailing slash if present
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

export const sendMessage = async (
  baseUrl: string,
  modelId: string,
  messages: Message[]
): Promise<ChatCompletionResponse> => {
  const cleanUrl = baseUrl.replace(/\/$/, '');
  
  // Convert internal Message type to OpenAI format (exclude timestamp)
  const apiMessages = messages.map(({ role, content }) => ({ role, content }));

  try {
    const response = await fetch(`${cleanUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: apiMessages,
        stream: false, // Per requirements: Stream not required
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