import { useState, useCallback } from 'react';
import { ChatSession, ExpertConfig } from '@/types';
import { toast } from 'sonner';

export function useSession() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // 保存会话
  const saveSession = useCallback((session: ChatSession) => {
    setSessions(prev => {
      const updated = prev.map(s => s.id === session.id ? session : s);
      localStorage.setItem('chat-sessions', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // 创建新会话
  const createNewSession = useCallback((expert: ExpertConfig) => {
    const session: ChatSession = {
      id: Date.now().toString(),
      title: '新对话',
      messages: [],
      expert: expert.name,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setSessions(prev => {
      const updated = [session, ...prev];
      localStorage.setItem('chat-sessions', JSON.stringify(updated));
      return updated;
    });

    setCurrentSessionId(session.id);
    return session;
  }, []);

  // 删除会话
  const deleteSession = useCallback((sessionId: string) => {
    const updatedSessions = sessions.filter((s: ChatSession) => s.id !== sessionId);
    setSessions(updatedSessions);
    localStorage.setItem('chat-sessions', JSON.stringify(updatedSessions));

    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }

    toast.success('会话已删除');
  }, [sessions, currentSessionId]);

  // 清空当前专家的所有会话
  const clearExpertSessions = useCallback((expertName: string) => {
    setSessions(prev => {
      const updatedSessions = prev.filter((s: ChatSession) => s.expert !== expertName);
      localStorage.setItem('chat-sessions', JSON.stringify(updatedSessions));
      return updatedSessions;
    });
    setCurrentSessionId(null);
    toast.success('对话已清空');
  }, []);

  // 选择会话
  const selectSession = useCallback((session: ChatSession) => {
    setCurrentSessionId(session.id);
    return session.messages || [];
  }, []);

  return {
    sessions,
    setSessions,
    currentSessionId,
    setCurrentSessionId,
    saveSession,
    createNewSession,
    deleteSession,
    clearExpertSessions,
    selectSession
  };
}
