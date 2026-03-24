"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AiChatMessage } from "@/components/dashboard/ai/ai-chat-message";
import { AiQuickPrompts } from "@/components/dashboard/ai/ai-quick-prompts";
import { useDashboardAi } from "@/hooks/dashboard/use-dashboard-ai";

interface AiAssistantPanelProps {
  embedded?: boolean;
}

export function AiAssistantPanel({
  embedded = false,
}: AiAssistantPanelProps) {
  const { messages, input, setInput, loading, sendMessage } = useDashboardAi();

  return (
    <div
      className={
        embedded
          ? "flex h-full min-h-0 flex-col"
          : "flex min-h-[520px] flex-col rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      }
    >
      {!embedded ? (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-black">Assistente IA</h3>
          <span className="rounded-full bg-black px-3 py-1 text-xs text-white">
            Beta
          </span>
        </div>
      ) : null}

      <div className="mb-4">
        <h4 className="text-[26px] font-semibold leading-8 tracking-[-0.04em] text-black">
          Como posso ajudar?
        </h4>
        <p className="mt-2 text-sm text-black/50">
          Pergunte sobre alunos, pagamentos, relatórios, cursos ou eventos.
        </p>
      </div>

      <AiQuickPrompts onSelect={sendMessage} />

      <div className="min-h-0 flex-1 overflow-y-auto rounded-[24px] bg-[#fafafa] p-4">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-black/45">
              Comece com uma pergunta ou use uma das sugestões acima.
            </p>
          ) : (
            messages.map((message) => (
              <AiChatMessage key={message.id} message={message} />
            ))
          )}

          {loading ? (
            <div className="max-w-[90%] rounded-2xl border border-black/5 bg-white px-4 py-3 text-sm text-black/60">
              Pensando...
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Input
          placeholder="Ex: quais alunos estão inadimplentes?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="h-11 rounded-2xl"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        <Button
          onClick={() => sendMessage()}
          disabled={loading}
          className="h-11 rounded-2xl bg-black px-5 text-white hover:bg-black/90"
        >
          Enviar
        </Button>
      </div>
    </div>
  );
}