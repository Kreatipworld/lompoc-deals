"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Loader2, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { UIMessage } from "ai"

const SUGGESTIONS = [
  "What deals are available today?",
  "Find me food & drink specials",
  "What are some fun things to do?",
  "Any upcoming events?",
]

function getTextContent(message: UIMessage): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("")
}

// Parse markdown links and bold, return React nodes
function renderMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  // Pattern: markdown links [text](url), bold **text**, and newlines
  const pattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\n/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index))
    }
    if (match[1] && match[2]) {
      // Markdown link
      const href = match[2]
      const isInternal = href.startsWith("/")
      parts.push(
        <a
          key={key++}
          href={href}
          target={isInternal ? undefined : "_blank"}
          rel={isInternal ? undefined : "noopener noreferrer"}
          className="underline underline-offset-2 font-medium hover:opacity-80"
          onClick={(e) => e.stopPropagation()}
        >
          {match[1]}
        </a>
      )
    } else if (match[3]) {
      // Bold
      parts.push(<strong key={key++}>{match[3]}</strong>)
    } else {
      // Newline
      parts.push(<br key={key++} />)
    }
    last = match.index + match[0].length
  }

  if (last < text.length) {
    parts.push(text.slice(last))
  }

  return parts
}

const transport = new DefaultChatTransport({ api: "/api/chat" })

export function AIChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, status } = useChat({ transport })

  const isLoading = status === "streaming" || status === "submitted"

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, open])

  useEffect(() => {
    if (open && messages.length === 0) {
      inputRef.current?.focus()
    }
  }, [open, messages.length])

  function handleSuggestion(text: string) {
    sendMessage({ text })
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    sendMessage({ text: trimmed })
    setInput("")
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-[4.5rem] right-3 sm:bottom-6 sm:right-4 z-50 w-[calc(100vw-1.5rem)] max-w-sm shadow-2xl rounded-2xl overflow-hidden border border-border bg-background flex flex-col">
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <p className="font-semibold text-sm leading-none">Lompoc Guide</p>
                <p className="text-xs opacity-80 mt-0.5">AI assistant for local deals &amp; places</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="opacity-80 hover:opacity-100 transition-opacity p-1 -mr-1"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[240px] max-h-[min(420px,calc(70vh-8rem))]">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm max-w-[85%]">
                  <p>Hi! I&apos;m your Lompoc Guide. Ask me about local deals, businesses, activities, or upcoming events!</p>
                </div>
                <div className="space-y-1.5 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSuggestion(s)}
                      className="block w-full text-left text-xs px-3 py-2.5 rounded-xl border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground active:scale-[0.98]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const text = getTextContent(m)
                if (!text && m.role !== "user") return null
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex",
                      m.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-2xl px-3.5 py-2.5 text-sm max-w-[85%]",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted rounded-tl-sm"
                      )}
                    >
                      {m.role === "assistant" ? renderMarkdown(text || "…") : (text || "…")}
                    </div>
                  </div>
                )
              })
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleFormSubmit}
            className="flex items-center gap-2 px-3 py-2.5 border-t border-border bg-background flex-shrink-0"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about deals, places, events…"
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground min-w-0"
              style={{ fontSize: "16px" }}
              disabled={isLoading}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-[4.5rem] right-3 sm:bottom-6 sm:right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all",
          "bg-primary text-primary-foreground hover:scale-105 active:scale-95",
          open && "hidden"
        )}
        aria-label="Open Lompoc Guide chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </>
  )
}
