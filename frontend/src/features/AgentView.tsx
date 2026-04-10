import React, { useState } from 'react';
import { useAgentChat } from '../useAgentChat';
import { ChatMessage } from '../components/ui/chat-message';
import { ChatInput } from '../components/ui/chat-input';
import { useDialect } from './DialectContext';
import { Bot, MessageSquare, Sparkles } from 'lucide-react';

export function AgentView() {
  const { t, dialect } = useDialect();
  
  const { messages, sendMessage, isStreaming, stopGeneration, error } = useAgentChat({
    streamFunc: 'run_agent_task_streaming',
    // We pass dialect as an extra arg to the backend
    onBeforeSend: (args) => ({ ...args, dialect })
  });

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="rounded-full bg-primary/10 p-6 shadow-glow">
              <Bot className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-heading font-bold">{t.welcome}</h2>
              <p className="text-muted-foreground max-w-md">
                {t.taskPlaceholder}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
              {[
                "لخص محتوى موقع ويكيبيديا عن مصر",
                "استخرج قائمة المنتجات من هذا المتجر",
                "ابحث عن آخر أخبار التكنولوجيا اليوم",
                "حلل سياسة الخصوصية لهذا الموقع"
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="p-3 text-sm rounded-xl border border-white/10 bg-card/50 hover:bg-primary/5 hover:border-primary/30 transition-all text-right flex items-center justify-between gap-3 group"
                >
                  <Sparkles className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} {...msg} />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-background/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
          <ChatInput 
            onSend={sendMessage} 
            isStreaming={isStreaming} 
            onStop={stopGeneration} 
            placeholder={t.taskPlaceholder}
          />
        </div>
      </div>
    </div>
  );
}
