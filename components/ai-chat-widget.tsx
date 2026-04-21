"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useState, useRef, useEffect, useCallback } from "react"
import { MessageCircle, X, Send, Loader2, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UIMessage } from "ai"

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  brand: "#4F46E5",
  brandShadow: "rgba(79,70,229,0.35)",
  brandBubbleShadow: "rgba(79,70,229,0.25)",
  brandLight: "#EEF2FF",
  accent: "#0D9488",
  bg: "#F3F4F6",
  surface: "#FFFFFF",
  text: "#111827",
  textMuted: "#6B7280",
  textSubtle: "#9CA3AF",
  border: "#E5E7EB",
  separator: "#D1D5DB",
  online: "#10B981",
} as const

// ─── Suggestions ──────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "What deals are available today?",
  "Find me food & drink specials",
  "What are some fun things to do?",
  "Any upcoming events?",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTextContent(message: UIMessage): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("")
}

function isEmojiOnly(text: string): boolean {
  const clean = text.trim()
  // Simple heuristic: no ASCII letters/digits, short length
  return clean.length <= 8 && !/[a-zA-Z0-9]/.test(clean)
}

interface ExtractedLink {
  label: string
  url: string
}

function extractLinks(text: string): ExtractedLink[] {
  const links: ExtractedLink[] = []
  const re = /\[([^\]]+)\]\(([^)]+)\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) links.push({ label: m[1], url: m[2] })
  return links
}

function getDomain(url: string): string {
  try {
    if (url.startsWith("/")) return "lompocdeals.com"
    return new URL(url).hostname.replace("www.", "")
  } catch {
    return ""
  }
}

// Render markdown with inline links, bold, phone numbers, and line breaks
function renderMarkdown(text: string, isOutgoing: boolean): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const re =
    /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|(https?:\/\/[^\s<>"')\]]+)|(\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4})|\n/g
  let last = 0
  let key = 0
  let m: RegExpExecArray | null

  const linkClass = cn(
    "underline underline-offset-2 font-medium active:opacity-60 touch-manipulation",
    isOutgoing && "text-white/90"
  )

  const makeLink = (href: string, label: React.ReactNode) => {
    const internal = href.startsWith("/")
    const tel = href.startsWith("tel:")
    return (
      <a
        key={key++}
        href={href}
        target={internal || tel ? undefined : "_blank"}
        rel={internal || tel ? undefined : "noopener noreferrer"}
        className={linkClass}
        onClick={(e) => e.stopPropagation()}
      >
        {label}
      </a>
    )
  }

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[1] && m[2]) {
      parts.push(makeLink(m[2], m[1]))
    } else if (m[3]) {
      parts.push(<strong key={key++}>{m[3]}</strong>)
    } else if (m[4]) {
      const url = m[4].replace(/[.,;:!?]+$/, "")
      parts.push(makeLink(url, url))
    } else if (m[5]) {
      parts.push(makeLink(`tel:+1${m[5].replace(/\D/g, "")}`, m[5]))
    } else {
      parts.push(<br key={key++} />)
    }
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LinkChip({ link, isOutgoing }: { link: ExtractedLink; isOutgoing: boolean }) {
  const domain = getDomain(link.url)
  const internal = link.url.startsWith("/")
  return (
    <a
      href={link.url}
      target={internal ? undefined : "_blank"}
      rel={internal ? undefined : "noopener noreferrer"}
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-3 rounded-xl min-h-[48px] px-3 py-2.5 w-full active:opacity-75 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        background: isOutgoing ? "rgba(79,70,229,0.1)" : T.surface,
        border: `1px solid ${isOutgoing ? "rgba(79,70,229,0.2)" : T.border}`,
        outlineColor: T.brand,
      }}
      aria-label={`Open: ${link.label}`}
    >
      <div
        className="flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center text-xl"
        style={{ background: T.brandLight }}
        aria-hidden="true"
      >
        {internal ? "🏪" : "🔗"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate leading-snug" style={{ color: T.text }}>
          {link.label}
        </p>
        {domain && (
          <p className="text-[11px] leading-snug mt-0.5" style={{ color: T.accent }}>
            {domain}
          </p>
        )}
      </div>
      <span className="flex-shrink-0 text-sm leading-none" style={{ color: T.textSubtle }} aria-hidden="true">
        ›
      </span>
    </a>
  )
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 my-3" role="separator" aria-label={label}>
      <div className="flex-1 h-px" style={{ background: T.separator }} />
      <span className="text-[11px] font-medium px-1 flex-shrink-0" style={{ color: T.textSubtle }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: T.separator }} />
    </div>
  )
}

// ─── Bubble radius by group position ─────────────────────────────────────────
type GroupPos = "only" | "first" | "middle" | "last"

function bubbleRadius(pos: GroupPos, outgoing: boolean): string {
  if (outgoing) {
    return pos === "middle" ? "4px 18px 4px 18px"
      : pos === "last"   ? "4px 18px 18px 18px"
      : "18px 18px 4px 18px" // only / first
  }
  return pos === "middle" ? "4px 18px 18px 4px"
    : pos === "last"   ? "4px 18px 18px 18px"
    : "18px 18px 18px 4px" // only / first
}

// ─── Message group builder ────────────────────────────────────────────────────
interface MsgItem {
  id: string
  text: string
  emojiOnly: boolean
  links: ExtractedLink[]
}
interface MsgGroup {
  role: "user" | "assistant"
  items: MsgItem[]
  showDate: boolean
}

function buildGroups(messages: UIMessage[]): MsgGroup[] {
  const groups: MsgGroup[] = []
  let dateShown = false
  let cur: MsgGroup | null = null

  for (const msg of messages) {
    const text = getTextContent(msg)
    if (!text && msg.role !== "user") continue

    const item: MsgItem = {
      id: msg.id,
      text,
      emojiOnly: isEmojiOnly(text),
      links: msg.role === "assistant" ? extractLinks(text) : [],
    }

    if (cur && cur.role === (msg.role as "user" | "assistant")) {
      cur.items.push(item)
    } else {
      cur = { role: msg.role as "user" | "assistant", items: [item], showDate: !dateShown }
      dateShown = true
      groups.push(cur)
    }
  }
  return groups
}

// ─── Main widget ──────────────────────────────────────────────────────────────
const transport = new DefaultChatTransport({ api: "/api/chat" })

export function AIChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [showScrollFab, setShowScrollFab] = useState(false)
  const messagesRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, sendMessage, status } = useChat({ transport })
  const isLoading = status === "streaming" || status === "submitted"

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    endRef.current?.scrollIntoView({ behavior })
  }, [])

  useEffect(() => {
    if (open) scrollToBottom()
  }, [messages, open, scrollToBottom])

  useEffect(() => {
    if (open && messages.length === 0) textareaRef.current?.focus()
  }, [open, messages.length])

  // Auto-resize textarea up to ~4 lines (108px)
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "42px"
    ta.style.height = `${Math.min(ta.scrollHeight, 108)}px`
  }, [input])

  function handleScroll() {
    const el = messagesRef.current
    if (!el) return
    setShowScrollFab(el.scrollHeight - el.scrollTop - el.clientHeight > el.clientHeight)
  }

  function submit() {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    sendMessage({ text: trimmed })
    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "42px"
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    submit()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const groups = buildGroups(messages)

  return (
    <>
      {/* ── Chat panel ──────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-[4.5rem] right-3 sm:bottom-6 sm:right-4 z-50 w-[calc(100vw-1.5rem)] max-w-sm flex flex-col overflow-hidden shadow-2xl"
          style={{
            borderRadius: "20px",
            background: T.bg,
            maxHeight: "min(600px, calc(85vh - 6rem))",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 flex-shrink-0"
            style={{ height: "60px", background: T.surface, borderBottom: `1px solid ${T.border}` }}
          >
            <div className="flex items-center gap-3">
              {/* Avatar with online dot */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-sm font-bold text-white select-none"
                  style={{ background: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)" }}
                  aria-hidden="true"
                >
                  LG
                </div>
                <span
                  className="absolute bottom-0 right-0 w-[9px] h-[9px] rounded-full"
                  style={{ background: T.online, border: `2px solid ${T.surface}` }}
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-[15px] font-semibold leading-none" style={{ color: T.text }}>
                  Lompoc Guide
                </p>
                <p className="text-[11px] font-medium mt-0.5" style={{ color: T.online }}>
                  Online · AI assistant
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex items-center justify-center rounded-full transition-opacity hover:opacity-70 active:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ width: "36px", height: "36px", outlineColor: T.brand }}
              aria-label="Close chat"
            >
              <X className="w-5 h-5" style={{ color: T.textMuted }} />
            </button>
          </div>

          {/* Messages area + scroll FAB wrapper */}
          <div className="relative flex-1 min-h-0">
            <div
              ref={messagesRef}
              onScroll={handleScroll}
              className="absolute inset-0 overflow-y-auto px-3 py-3"
            >
              {messages.length === 0 ? (
                /* Welcome state */
                <div className="space-y-3">
                  <div
                    className="px-[14px] py-[10px] max-w-[80%] text-[15px]"
                    style={{
                      background: T.surface,
                      borderRadius: "18px 18px 18px 4px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                      lineHeight: "1.45",
                      color: T.text,
                    }}
                  >
                    Hi! I&apos;m your Lompoc Guide. Ask me about local deals, businesses, activities, or upcoming events!
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage({ text: s })}
                        className="block w-full text-left text-xs px-3 py-2.5 rounded-xl transition-colors active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2"
                        style={{
                          border: `1px solid ${T.border}`,
                          background: T.surface,
                          color: T.textMuted,
                          outlineColor: T.brand,
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Message groups */
                <div className="flex flex-col gap-2">
                  {groups.map((group, gi) => (
                    <div key={gi}>
                      {group.showDate && <DateSeparator label="Today" />}
                      <div
                        className="flex flex-col"
                        style={{
                          gap: "2px",
                          alignItems: group.role === "user" ? "flex-end" : "flex-start",
                        }}
                      >
                        {group.items.map((item, ii) => {
                          const count = group.items.length
                          const pos: GroupPos =
                            count === 1 ? "only"
                            : ii === 0 ? "first"
                            : ii === count - 1 ? "last"
                            : "middle"
                          const outgoing = group.role === "user"

                          return (
                            <div key={item.id} className="flex flex-col" style={{ alignItems: outgoing ? "flex-end" : "flex-start" }}>
                              {/* Bubble */}
                              <div
                                className={cn(
                                  "max-w-[80%]",
                                  item.emojiOnly ? "px-[12px] py-[8px]" : "px-[14px] py-[10px]"
                                )}
                                style={{
                                  background: outgoing ? T.brand : T.surface,
                                  borderRadius: bubbleRadius(pos, outgoing),
                                  boxShadow: outgoing
                                    ? `0 2px 8px ${T.brandBubbleShadow}`
                                    : "0 1px 2px rgba(0,0,0,0.08)",
                                  fontSize: item.emojiOnly ? "28px" : "15px",
                                  lineHeight: item.emojiOnly ? "1.2" : "1.45",
                                  color: outgoing ? "#FFFFFF" : T.text,
                                  wordBreak: "break-word",
                                }}
                              >
                                {group.role === "assistant"
                                  ? renderMarkdown(item.text || "…", false)
                                  : (item.text || "…")}
                              </div>
                              {/* Link chips below bubble */}
                              {item.links.length > 0 && (
                                <div
                                  className="flex flex-col gap-1.5 mt-1.5"
                                  style={{ width: "min(86%, 100%)" }}
                                >
                                  {item.links.slice(0, 3).map((link, li) => (
                                    <LinkChip key={li} link={link} isOutgoing={false} />
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div
                        className="px-[14px] py-[10px]"
                        style={{
                          background: T.surface,
                          borderRadius: "18px 18px 18px 4px",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                        }}
                      >
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: T.textMuted }} />
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Scroll-to-bottom FAB */}
            {showScrollFab && (
              <button
                onClick={() => scrollToBottom()}
                className="absolute right-5 bottom-5 flex items-center justify-center rounded-full transition-opacity hover:opacity-80 active:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  width: "40px",
                  height: "40px",
                  background: T.surface,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                  outlineColor: T.brand,
                }}
                aria-label="Scroll to latest messages"
              >
                <ChevronDown className="w-4 h-4" style={{ color: T.brand }} />
              </button>
            )}
          </div>

          {/* Input bar */}
          <form
            onSubmit={handleFormSubmit}
            className="flex items-end gap-2 flex-shrink-0"
            style={{
              background: T.surface,
              borderTop: `1px solid ${T.border}`,
              padding: "10px 14px 24px",
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about deals, places, events…"
              rows={1}
              className="flex-1 resize-none outline-none min-w-0 overflow-y-auto"
              style={{
                fontSize: "15px",
                background: T.bg,
                border: `1.5px solid ${T.border}`,
                borderRadius: "22px",
                minHeight: "42px",
                maxHeight: "108px",
                padding: "11px 16px",
                lineHeight: "1.4",
                color: T.text,
              }}
              disabled={isLoading}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Message input"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex-shrink-0 flex items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                width: "42px",
                height: "42px",
                minWidth: "42px",
                background: T.brand,
                boxShadow: `0 2px 8px ${T.brandShadow}`,
                outlineColor: T.brand,
              }}
              aria-label="Send message"
            >
              <Send className="w-[18px] h-[18px] text-white" />
            </button>
          </form>
        </div>
      )}

      {/* ── Launch FAB ──────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-[4.5rem] right-3 sm:bottom-6 sm:right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2",
          open && "hidden"
        )}
        style={{
          background: T.brand,
          color: "#FFFFFF",
          boxShadow: `0 2px 8px ${T.brandShadow}`,
          outlineColor: T.brand,
        }}
        aria-label="Open Lompoc Guide chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </>
  )
}
