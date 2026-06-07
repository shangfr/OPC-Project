import { useState, useRef, useCallback } from 'react';
import { Message, ExpertConfig, ChatSession } from '@/types';
import { chatStream } from '@/lib/api';
import { toast } from 'sonner';

export function useChat(
  expertConfig: ExpertConfig | null,
  sessions: ChatSession[],
  currentSessionId: string | null,
  messages: Message[],
  setCurrentSessionId: (id: string | null) => void,
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void,
  setSessions: (sessions: ChatSession[] | ((prev: ChatSession[]) => ChatSession[])) => void,
  saveSession: (session: ChatSession) => void,
  createNewSession: (expert: ExpertConfig) => ChatSession
) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const handleSend = useCallback(async (
    text: string,
    enableSearch: boolean = false,
    enableThinking: boolean = false,
    files?: any[]
  ) => {
    if (!expertConfig || !text.trim()) return;

    // 停止当前流
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 创建会话（如果是第一条消息）
    let sessionId = currentSessionId;
    if (!sessionId) {
      const session = createNewSession(expertConfig);
      sessionId = session.id;
    }

    // 添加用户消息（记录标记状态）
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      enableSearch,
      enableThinking,
      hasFiles: files && files.length > 0
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // 保存当前会话状态
    if (sessionId) {
      const currentMessages = [...messages, userMessage];
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        session.messages = currentMessages;
        session.updatedAt = Date.now();
        saveSession(session);
      }
    }

    // 创建 AI 消息占位
    const assistantMessageId = (Date.now() + 1).toString();
    setStreamingMessageId(assistantMessageId);

    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      thinking: '',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, assistantMessage]);

    // 调用流式 API
    abortControllerRef.current = new AbortController();

    try {
      const stream = chatStream(
        text,
        expertConfig.name,
        messages,
        enableSearch,
        enableThinking,
        abortControllerRef.current?.signal,
        files
      );

      let thinkingContent = '';
      let contentText = '';

      // 使用 requestAnimationFrame 优化更新频率
      let pendingUpdate = false;

      const updateMessage = () => {
        if (pendingUpdate) return;
        pendingUpdate = true;

        requestAnimationFrame(() => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, thinking: thinkingContent, content: contentText }
                : msg
            )
          );
          pendingUpdate = false;
        });
      };

      try {
        for await (const chunk of stream) {
          if (chunk.type === 'thinking') {
            thinkingContent += chunk.data;
          } else if (chunk.type === 'content') {
            contentText += chunk.data;
          }
          updateMessage();
        }
      } catch (error: any) {
        if (error.name === 'AbortError' || error.message === 'The operation was aborted') {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: msg.content + '\n\n---\n*回答已终止*',
                    thinking: enableThinking ? thinkingContent : undefined
                  }
                : msg
            )
          );
          setStreamingMessageId(null);
          setIsLoading(false);
          abortControllerRef.current = null;
          return;
        }
        throw error;
      }

      // 强制最后一次更新
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                thinking: enableThinking ? thinkingContent : undefined,
                content: contentText
              }
            : msg
        )
      );

      setStreamingMessageId(null);

      // 更新会话
      const currentMessages = [...messages, userMessage, {
        ...assistantMessage,
        thinking: enableThinking ? thinkingContent : undefined,
        content: contentText
      }];

      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        session.title = session.title === '新对话'
          ? text.slice(0, 30) + (text.length > 30 ? '...' : '')
          : session.title;
        session.messages = currentMessages;
        session.updatedAt = Date.now();
        saveSession(session);
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Chat error:', error);
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: '抱歉，出现了错误，请稍后重试。' }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
      abortControllerRef.current = null;
    }
  }, [expertConfig, currentSessionId, messages, sessions, createNewSession, saveSession, setMessages, setSessions]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setStreamingMessageId(null);
      abortControllerRef.current = null;
      toast.info('已停止生成');
    }
  }, []);

  return {
    isLoading,
    streamingMessageId,
    handleSend,
    handleStop
  };
}
