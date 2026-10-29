/**
 * Client kết nối API Chatbot UTH (Hỗ trợ 2 chế độ: Khách & Sinh viên)
 */

export interface ChatRequestPayload {
  message: string;
  history?: Array<{ role: string; text: string }>;
  studentContext?: {
    name: string;
    mssv: string;
    cohort?: string;
    major?: string;
  };
}

export interface ChatResponsePayload {
  reply: string;
  metadata?: {
    intent?: string;
    confidence?: number;
    engine?: string;
    latencyMs?: number;
  };
  citations?: Array<{
    title: string;
    sourceUrl?: string;
    page?: number;
  }>;
}

export async function sendChatMessage(
  payload: ChatRequestPayload,
  isGuest: boolean
): Promise<ChatResponsePayload> {
  const endpoint = isGuest ? '/api/v1/chat/guest' : '/api/v1/chat/student';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      // Fallback về endpoint tương thích /api/chat nếu route v1 chưa hỗ trợ
      const fallbackRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!fallbackRes.ok) {
        throw new Error(`Máy chủ phản hồi mã lỗi: ${fallbackRes.status}`);
      }
      return await fallbackRes.json();
    }

    const data = await res.json();
    return data.data || data;
  } catch (error) {
    console.warn('Lỗi khi gọi API chat:', error);
    throw error;
  }
}

export interface StreamChatPayload {
  message: string;
  role?: 'guest' | 'student' | 'parent';
  history?: Array<{ role: string; text: string }>;
  studentContext?: {
    name: string;
    mssv: string;
    cohort?: string;
    major?: string;
  };
}

export interface StreamChatCallbacks {
  onChunk: (chunk: string) => void;
  onDone: (metadata?: any) => void;
  onError: (err: any) => void;
}

/**
 * Gửi tin nhắn và nhận phản hồi dạng SSE Streaming thời gian thực
 */
export async function streamChatMessage(
  payload: StreamChatPayload,
  callbacks: StreamChatCallbacks,
  signal?: AbortSignal
): Promise<void> {
  try {
    const res = await fetch('/api/v1/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      throw new Error(`Máy chủ AI phản hồi mã lỗi: ${res.status}`);
    }

    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error('Trình duyệt không hỗ trợ đọc Stream');
    }

    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const jsonStr = trimmed.slice(6);
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.chunk) {
            callbacks.onChunk(parsed.chunk);
          }
          if (parsed.done) {
            callbacks.onDone(parsed);
          }
        } catch {
          // Bỏ qua dòng json chưa hoàn chỉnh
        }
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      callbacks.onDone({ stopped: true });
      return;
    }
    callbacks.onError(error);
  }
}

