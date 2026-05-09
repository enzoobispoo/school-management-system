"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCheck,
  Download,
  Images,
  Loader2,
  Lock,
  MessageSquarePlus,
  Megaphone,
  MoreHorizontal,
  MoreVertical,
  Paperclip,
  Pencil,
  Pin,
  PinOff,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  dashboardLocaleTag,
  useDashboardLanguage,
} from "@/lib/i18n/dashboard-language";

type Contact = {
  id: string;
  nome: string;
  email: string;
  role: string;
  avatarUrl: string | null;
};

type ThreadRow = {
  id: string;
  kind: "direct" | "group";
  title: string | null;
  peer: Contact | null;
  participantCount: number;
  writePolicy: string;
  ownerUserId: string | null;
  viewerCanPost: boolean;
  isPinned: boolean;
  unreadCount: number;
  lastMessage: {
    preview: string;
    createdAt: string;
    fromSelf: boolean;
  } | null;
  updatedAt: string;
};

type MessageRow = {
  id: string;
  body: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: string;
  editedAt: string | null;
  pinnedAt: string | null;
  deletedForEveryone: boolean;
  fromSelf: boolean;
  sender: { id: string; nome: string; avatarUrl: string | null };
};

type MsgThreadCaps = {
  kind: "direct" | "group";
  title: string | null;
  peer: Contact | null;
  writePolicy: string;
  viewerCanPost: boolean;
  counterpartLastReadAt: string | null;
  othersLastReadAt: (string | null)[];
};

type MediaRow = {
  id: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: string;
  fromSelf: boolean;
  senderNome: string;
};

function messageReadByPeers(msg: MessageRow, caps: MsgThreadCaps | null) {
  if (!msg.fromSelf || msg.deletedForEveryone || !caps) return false;
  const tMsg = new Date(msg.createdAt).getTime();
  if (caps.kind === "direct") {
    if (!caps.counterpartLastReadAt) return false;
    return new Date(caps.counterpartLastReadAt).getTime() >= tMsg;
  }
  const reads = caps.othersLastReadAt ?? [];
  if (!reads.length) return false;
  return reads.every(
    (iso) => iso != null && new Date(iso).getTime() >= tMsg
  );
}

function isLikelyChatImage(url: string, name: string | null) {
  const u = url.toLowerCase();
  return /\.(png|jpe?g|webp|gif)(\?|$)/i.test(u) || /^image\//i.test(name ?? "");
}

function pinnedMessagePreview(m: MessageRow, emptyLabel: string) {
  const text = m.body.trim();
  if (text) return `${text.slice(0, 72)}${text.length > 72 ? "…" : ""}`;
  if (m.attachmentName) return `📎 ${m.attachmentName}`.slice(0, 72);
  return emptyLabel;
}

function initials(nome: string) {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function ChatAvatar(props: {
  nome: string;
  avatarUrl: string | null | undefined;
  className?: string;
}) {
  const { nome, avatarUrl, className } = props;
  return (
    <Avatar className={cn("ring-1 ring-border/60", className)}>
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt="" className="object-cover" />
      ) : null}
      <AvatarFallback className="text-[10px] font-semibold">
        {initials(nome)}
      </AvatarFallback>
    </Avatar>
  );
}

async function downloadChatMedia(url: string, filename: string, fallbackName: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("fetch");
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download =
      filename.replace(/[^\w.\-()\s]/g, "_").slice(0, 180) || fallbackName;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function SchoolChatPage() {
  const { t, language } = useDashboardLanguage();
  const localeTag = dashboardLocaleTag(language);

  function roleLabel(role: string) {
    const key = `chat.role.${role}`;
    const raw = t(key);
    return raw === key ? role : raw;
  }

  const searchParams = useSearchParams();
  const threadFromUrl = searchParams.get("thread");

  const [newOpen, setNewOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [canCreateGroups, setCanCreateGroups] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<MessageRow[]>([]);
  const [msgThreadCaps, setMsgThreadCaps] = useState<MsgThreadCaps | null>(null);
  const [body, setBody] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [groupTitle, setGroupTitle] = useState("");
  const [groupOwnerOnly, setGroupOwnerOnly] = useState(false);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>(
    []
  );
  const [creatingGroup, setCreatingGroup] = useState(false);

  const [threadFilter, setThreadFilter] = useState<"all" | "direct" | "group">(
    "all"
  );

  const [editOpen, setEditOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<MessageRow | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaRow[]>([]);
  const [mediaPreview, setMediaPreview] = useState<MediaRow | null>(null);

  const loadThreads = useCallback(async () => {
    try {
      setLoadingThreads(true);
      const q =
        threadFilter === "all" ? "" : `?filter=${encodeURIComponent(threadFilter)}`;
      const res = await fetch(`/api/school-chat/threads${q}`, {
        cache: "no-store",
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erro");
      setThreads(j.data ?? []);
      setCanCreateGroups(Boolean(j.meta?.canCreateGroups));
    } catch {
      toast.error(t("chat.toast.loadThreadsFail"));
    } finally {
      setLoadingThreads(false);
    }
  }, [threadFilter, t]);

  const loadContacts = useCallback(async () => {
    try {
      const res = await fetch("/api/school-chat/contacts", { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erro");
      setContacts(j.data ?? []);
    } catch {
      toast.error(t("chat.toast.loadContactsFail"));
    }
  }, [t]);

  const loadMedia = useCallback(async (threadId: string) => {
    try {
      setMediaLoading(true);
      const res = await fetch(`/api/school-chat/threads/${threadId}/media`, {
        cache: "no-store",
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erro");
      setMediaItems(j.data ?? []);
    } catch {
      toast.error(t("chat.toast.loadMediaFail"));
      setMediaItems([]);
    } finally {
      setMediaLoading(false);
    }
  }, [t]);

  const loadMessages = useCallback(
    async (threadId: string, syncThreadsList = true) => {
      try {
        setLoadingMsgs(true);
        setMsgThreadCaps(null);
        setPinnedMessages([]);
        const res = await fetch(
          `/api/school-chat/threads/${threadId}/messages?take=80`,
          { cache: "no-store" }
        );
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Erro");
        setMessages(j.data ?? []);
        setPinnedMessages(Array.isArray(j.pinned) ? j.pinned : []);
        if (j.thread && typeof j.thread === "object") {
          setMsgThreadCaps(j.thread as MsgThreadCaps);
        }
        if (syncThreadsList) void loadThreads();
      } catch {
        toast.error(t("chat.toast.loadMessagesFail"));
      } finally {
        setLoadingMsgs(false);
      }
    },
    [loadThreads, t]
  );

  useEffect(() => {
    void loadThreads();
    void loadContacts();
  }, [loadThreads, loadContacts]);

  useEffect(() => {
    const tid = threadFromUrl?.trim();
    if (!tid) return;
    setActiveId(tid);
  }, [threadFromUrl]);

  useEffect(() => {
    if (!mediaOpen || !activeId) return;
    void loadMedia(activeId);
  }, [mediaOpen, activeId, loadMedia]);

  useEffect(() => {
    const id = window.setInterval(() => void loadThreads(), 15000);
    return () => window.clearInterval(id);
  }, [loadThreads]);

  useEffect(() => {
    if (!activeId) return;
    void loadMessages(activeId, true);
    const id = window.setInterval(() => void loadMessages(activeId, false), 7000);
    return () => window.clearInterval(id);
  }, [activeId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeId]);

  function toggleGroupMember(userId: string) {
    setSelectedGroupMembers((prev) =>
      prev.includes(userId) ?
        prev.filter((id) => id !== userId)
      : [...prev, userId]
    );
  }

  async function openWith(peerUserId: string) {
    try {
      const res = await fetch("/api/school-chat/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerUserId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erro");
      await loadThreads();
      setActiveId(j.threadId);
      setNewOpen(false);
      toast.success(t("chat.toast.threadOpened"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("chat.toast.openThreadError"));
    }
  }

  async function patchThread(
    threadId: string,
    patch: { pinned?: boolean; hideForMe?: boolean }
  ) {
    const body: Record<string, boolean> = {};
    if (typeof patch.pinned === "boolean") body.pinned = patch.pinned;
    if (typeof patch.hideForMe === "boolean") body.hideForMe = patch.hideForMe;
    try {
      const res = await fetch(`/api/school-chat/threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erro");
      await loadThreads();
      if (typeof patch.pinned === "boolean") {
        toast.success(
          patch.pinned ? t("chat.toast.threadPinned") : t("chat.toast.threadUnpinned")
        );
      }
      if (patch.hideForMe) {
        toast.success(t("chat.toast.threadHiddenForYou"));
        if (activeId === threadId) setActiveId(null);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("chat.toast.threadPatchError"));
    }
  }

  async function toggleMessagePin(m: MessageRow, pinned: boolean) {
    if (!activeId) return;
    try {
      const res = await fetch(
        `/api/school-chat/threads/${activeId}/messages/${m.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pinned }),
        }
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erro");
      void loadMessages(activeId, true);
      toast.success(pinned ? t("chat.toast.msgPinned") : t("chat.toast.msgUnpinned"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("chat.toast.pinError"));
    }
  }

  async function deleteMessageRow(m: MessageRow, scope: "me" | "all") {
    if (!activeId) return;
    if (scope === "all") {
      const ok = window.confirm(t("chat.confirm.deleteForAll"));
      if (!ok) return;
    }
    try {
      const res = await fetch(
        `/api/school-chat/threads/${activeId}/messages/${m.id}?for=${scope}`,
        { method: "DELETE" }
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erro");
      void loadMessages(activeId, true);
      toast.success(
        scope === "all"
          ? t("chat.toast.deletedForAll")
          : t("chat.toast.deletedForMe")
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("chat.toast.deleteError"));
    }
  }

  function openEditMessage(m: MessageRow) {
    setEditingMessage(m);
    setEditDraft(m.body);
    setEditOpen(true);
  }

  async function saveEditedMessage() {
    if (!activeId || !editingMessage) return;
    const text = editDraft.trim();
    if (!text) {
      toast.error(t("chat.toast.emptyMessage"));
      return;
    }
    try {
      setSavingEdit(true);
      const res = await fetch(
        `/api/school-chat/threads/${activeId}/messages/${editingMessage.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text }),
        }
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erro");
      setMessages((prev) =>
        prev.map((row) =>
          row.id === editingMessage.id ? { ...row, ...(j as MessageRow) } : row
        )
      );
      setEditOpen(false);
      setEditingMessage(null);
      void loadThreads();
      toast.success(t("chat.toast.messageUpdated"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("chat.toast.saveEditError"));
    } finally {
      setSavingEdit(false);
    }
  }

  async function createGroup() {
    const title = groupTitle.trim();
    if (title.length < 2) {
      toast.error(t("chat.toast.groupNameInvalid"));
      return;
    }
    if (selectedGroupMembers.length === 0) {
      toast.error(t("chat.toast.groupPickMembers"));
      return;
    }
    try {
      setCreatingGroup(true);
      const res = await fetch("/api/school-chat/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group: {
            title,
            memberUserIds: selectedGroupMembers,
            writePolicy: groupOwnerOnly ? "OWNER_ONLY" : "ALL_MEMBERS",
          },
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erro");
      await loadThreads();
      setActiveId(j.threadId);
      setGroupOpen(false);
      setGroupTitle("");
      setGroupOwnerOnly(false);
      setSelectedGroupMembers([]);
      toast.success(t("chat.toast.groupCreated"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("chat.toast.groupCreateError"));
    } finally {
      setCreatingGroup(false);
    }
  }

  async function sendMessage() {
    if (!activeId || sending) return;
    const text = body.trim();
    const file = fileRef.current?.files?.[0];
    if (!text && !file) return;

    try {
      setSending(true);
      if (file) {
        const fd = new FormData();
        if (text) fd.append("body", text);
        fd.append("file", file);
        const res = await fetch(`/api/school-chat/threads/${activeId}/messages`, {
          method: "POST",
          body: fd,
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Erro");
        setMessages((prev) => [...prev, j as MessageRow]);
        if (fileRef.current) fileRef.current.value = "";
      } else {
        const res = await fetch(`/api/school-chat/threads/${activeId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Erro");
        setMessages((prev) => [...prev, j as MessageRow]);
      }
      setBody("");
      void loadThreads();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("chat.toast.sendError"));
    } finally {
      setSending(false);
    }
  }

  const activeThread = threads.find((t) => t.id === activeId);
  const activePeer = activeThread?.peer ?? msgThreadCaps?.peer ?? null;

  const viewerCanPost =
    msgThreadCaps?.viewerCanPost ?? activeThread?.viewerCanPost ?? true;

  const capsKind = msgThreadCaps?.kind ?? activeThread?.kind ?? "direct";

  function groupPeopleLabel(count: number) {
    return count === 1 ?
        t("chat.people.one", { n: count })
      : t("chat.people.many", { n: count });
  }

  const headerTitle =
    capsKind === "group" ?
      activeThread?.title ?? msgThreadCaps?.title ?? t("chat.thread.title.group")
    : activePeer?.nome ?? t("chat.thread.title.direct");

  const headerSubtitle =
    capsKind === "group" ?
      activeThread ?
        `${groupPeopleLabel(activeThread.participantCount)}${t("chat.meta.sep")}${
          activeThread.writePolicy === "OWNER_ONLY" ?
            t("chat.writePolicy.ownerOnly")
          : t("chat.writePolicy.allMembers")
        }`
      : msgThreadCaps?.writePolicy === "OWNER_ONLY" ?
        t("chat.writePolicy.ownerOnly")
      : t("chat.groupHeader.subtitle")
    : activePeer?.role ? roleLabel(activePeer.role) : "";

  return (
    <DashboardLayout>
      <Header
        titleKey="chat.pageTitle"
        description={
          canCreateGroups ? t("chat.pageDesc.groups") : t("chat.pageDesc.direct")
        }
      />

      <div className="grid min-h-[calc(100dvh-8rem)] gap-0 border-y border-border/60 bg-background lg:grid-cols-[minmax(260px,320px)_1fr]">
        <aside className="flex min-h-0 flex-col border-border/60 lg:border-r">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {t("chat.sidebar.conversations")}
            </p>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {canCreateGroups ?
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 rounded-lg gap-1 text-xs"
                  type="button"
                  onClick={() => setGroupOpen(true)}
                >
                  <Megaphone className="h-3.5 w-3.5" />
                  {t("chat.action.group")}
                </Button>
              : null}
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg gap-1 text-xs"
                type="button"
                onClick={() => setNewOpen(true)}
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                {t("chat.action.direct")}
              </Button>
              <Dialog open={newOpen} onOpenChange={setNewOpen}>
                <DialogContent className="max-h-[min(560px,80vh)] sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t("chat.directDialog.title")}</DialogTitle>
                    <DialogDescription className="sr-only">
                      {t("chat.directDialog.desc")}
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-[420px] pr-3">
                    <ul className="flex flex-col gap-1">
                      {contacts.length === 0 ? (
                        <li className="py-6 text-center text-sm text-muted-foreground">
                          {t("chat.directDialog.empty")}
                        </li>
                      ) : (
                        contacts.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              className="flex w-full items-start gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-muted/40"
                              onClick={() => void openWith(c.id)}
                            >
                              <ChatAvatar
                                nome={c.nome}
                                avatarUrl={c.avatarUrl}
                                className="mt-0.5 size-9"
                              />
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium">
                                  {c.nome}
                                </span>
                                <span className="block truncate text-[11px] text-muted-foreground">
                                  {roleLabel(c.role)}
                                  {t("chat.meta.sep")}
                                  {c.email}
                                </span>
                              </span>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </ScrollArea>
                </DialogContent>
              </Dialog>

              <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
                <DialogContent className="max-h-[min(640px,88vh)] sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t("chat.groupDialog.title")}</DialogTitle>
                    <DialogDescription>{t("chat.groupDialog.desc")}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="group-title">{t("chat.groupDialog.nameLabel")}</Label>
                      <Input
                        id="group-title"
                        value={groupTitle}
                        onChange={(e) => setGroupTitle(e.target.value)}
                        placeholder={t("chat.groupDialog.namePlaceholder")}
                        maxLength={120}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-3">
                      <Checkbox
                        id="owner-only"
                        checked={groupOwnerOnly}
                        onCheckedChange={(v) => setGroupOwnerOnly(Boolean(v))}
                      />
                      <label htmlFor="owner-only" className="cursor-pointer text-sm leading-snug">
                        <span className="font-medium">
                          {t("chat.groupDialog.ownerOnlyTitle")}
                        </span>
                        <span className="mt-1 block text-muted-foreground text-[12px]">
                          {t("chat.groupDialog.ownerOnlyHint")}
                        </span>
                      </label>
                    </div>
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("chat.groupDialog.membersLabel")}
                      </p>
                      <ScrollArea className="max-h-[220px] rounded-xl border border-border/50 pr-2">
                        <ul className="flex flex-col gap-1 p-2">
                          {contacts.map((c) => (
                            <li key={c.id}>
                              <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
                                <Checkbox
                                  checked={selectedGroupMembers.includes(c.id)}
                                  onCheckedChange={() => toggleGroupMember(c.id)}
                                />
                                <ChatAvatar
                                  nome={c.nome}
                                  avatarUrl={c.avatarUrl}
                                  className="size-8"
                                />
                                <span className="min-w-0 text-sm">
                                  <span className="block truncate font-medium">{c.nome}</span>
                                  <span className="block truncate text-[11px] text-muted-foreground">
                                    {roleLabel(c.role)}
                                  </span>
                                </span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </div>
                    <Button
                      type="button"
                      className="w-full rounded-xl"
                      disabled={creatingGroup}
                      onClick={() => void createGroup()}
                    >
                      {creatingGroup ?
                        <Loader2 className="h-4 w-4 animate-spin" />
                      : t("chat.groupDialog.create")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 border-b border-border/50 px-3 py-2">
            {(
              [
                { id: "all" as const, labelKey: "chat.tabs.all" as const },
                { id: "direct" as const, labelKey: "chat.tabs.direct" as const },
                { id: "group" as const, labelKey: "chat.tabs.group" as const },
              ] as const
            ).map((tab) => (
              <Button
                key={tab.id}
                type="button"
                size="sm"
                variant={threadFilter === tab.id ? "secondary" : "ghost"}
                className="h-7 rounded-full px-3 text-[11px]"
                onClick={() => setThreadFilter(tab.id)}
              >
                {t(tab.labelKey)}
              </Button>
            ))}
          </div>

          <ScrollArea className="min-h-0 flex-1">
            {loadingThreads ?
              <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("chat.list.loading")}
              </div>
            : threads.length === 0 ?
              <p className="p-4 text-sm text-muted-foreground">{t("chat.list.empty")}</p>
            : <ul className="p-2">
                {threads.map((row) => {
                  const unread = Math.max(0, row.unreadCount ?? 0);
                  return (
                    <li key={row.id} className="mb-1">
                      <button
                        type="button"
                        onClick={() => setActiveId(row.id)}
                        className={cn(
                          "flex w-full min-w-0 items-start gap-2 rounded-xl px-3 py-2.5 text-left transition-colors",
                          activeId === row.id ?
                            "bg-muted/80 ring-1 ring-border"
                          : "hover:bg-muted/40",
                          row.isPinned && "ring-1 ring-amber-500/35"
                        )}
                      >
                        <span className="relative shrink-0">
                          {row.isPinned ?
                            <Pin className="absolute -left-0.5 -top-0.5 h-3 w-3 text-amber-600 dark:text-amber-400" />
                          : null}
                          {row.kind === "group" ?
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted ring-1 ring-border/60">
                              <Users className="h-4 w-4 text-muted-foreground" />
                            </div>
                          : <ChatAvatar
                              nome={row.peer?.nome ?? "?"}
                              avatarUrl={row.peer?.avatarUrl ?? null}
                              className="size-9 shrink-0"
                            />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                "min-w-0 flex-1 truncate text-sm",
                                unread > 0 ?
                                  "font-semibold text-foreground"
                                : "font-medium text-foreground/95"
                              )}
                            >
                              {row.kind === "group" ?
                                row.title ?? t("chat.thread.title.group")
                              : row.peer?.nome ?? t("chat.thread.title.direct")}
                              {row.kind === "group" && row.writePolicy === "OWNER_ONLY" ?
                                <Lock
                                  className="ml-1 inline h-3 w-3 shrink-0 text-muted-foreground align-text-bottom"
                                  aria-hidden
                                />
                              : null}
                            </span>
                            {unread > 0 ?
                              <span className="inline-flex min-h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-primary px-1.5 font-mono text-[10px] font-bold leading-none text-primary-foreground">
                                {unread >= 99 ? "99+" : unread}
                              </span>
                            : null}
                          </span>
                          <span
                            className={cn(
                              "mt-0.5 block truncate text-[11px]",
                              unread > 0 ?
                                "font-medium text-emerald-700/90 dark:text-emerald-400/90"
                              : "text-muted-foreground"
                            )}
                          >
                            {row.lastMessage ?
                              `${row.lastMessage.fromSelf ? t("chat.thread.youPrefix") : ""}${row.lastMessage.preview}`
                            : t("chat.thread.noMessagesYet")}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            }
          </ScrollArea>

          <div className="border-t border-border/60 p-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground"
              asChild
            >
              <Link href="/docente">
                <ArrowLeft className="h-4 w-4" />
                {t("chat.backToDocente")}
              </Link>
            </Button>
          </div>
        </aside>

        <section className="flex min-h-[420px] flex-col bg-muted/15 dark:bg-muted/25">
          {!activeId ?
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
              <MessageSquarePlus className="h-10 w-10 opacity-40" />
              <p className="max-w-sm text-sm">{t("chat.emptyState.pickThread")}</p>
            </div>
          : <>
              <header className="flex items-center gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur">
                {capsKind === "group" ?
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted ring-1 ring-border/60">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                : <ChatAvatar
                    nome={activePeer?.nome ?? "?"}
                    avatarUrl={activePeer?.avatarUrl ?? null}
                    className="size-10 shrink-0"
                  />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{headerTitle}</p>
                  <p className="truncate font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                    {headerSubtitle}
                  </p>
                </div>
                {activeId ?
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
                        aria-label={t("chat.threadMenu.aria")}
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem
                        onClick={() =>
                          void patchThread(activeId, {
                            pinned: !(activeThread?.isPinned ?? false),
                          })
                        }
                      >
                        {activeThread?.isPinned ?
                          <>
                            <PinOff className="mr-2 h-4 w-4" />
                            {t("chat.threadMenu.unpin")}
                          </>
                        : <>
                            <Pin className="mr-2 h-4 w-4" />
                            {t("chat.threadMenu.pin")}
                          </>
                        }
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setMediaOpen(true)}>
                        <Images className="mr-2 h-4 w-4" />
                        {t("chat.threadMenu.media")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => void patchThread(activeId, { hideForMe: true })}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("chat.threadMenu.deleteForMe")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                : null}
              </header>

              <ScrollArea className="flex-1 px-4 py-4">
                {loadingMsgs ?
                  <div className="flex justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                : <>
                    {pinnedMessages.length > 0 ?
                      <div className="mb-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 px-3 py-2 dark:bg-amber-950/25">
                        <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-400">
                          <Pin className="h-3 w-3" />
                          {t("chat.pinnedMessages.title")}
                        </p>
                        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {pinnedMessages.map((pm) => (
                            <button
                              key={pm.id}
                              type="button"
                              className="max-w-[168px] shrink-0 rounded-xl border border-border/60 bg-background/95 px-2.5 py-2 text-left text-[11px] shadow-sm transition-colors hover:bg-muted/60"
                              onClick={() =>
                                document
                                  .getElementById(`school-chat-msg-${pm.id}`)
                                  ?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center",
                                  })
                              }
                            >
                              <span className="line-clamp-2 text-muted-foreground">
                                {pinnedMessagePreview(pm, t("chat.emptyPreview"))}
                              </span>
                              <span className="mt-1 block truncate font-mono text-[9px] text-muted-foreground/80">
                                {pm.fromSelf ? t("chat.you") : pm.sender.nome}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    : null}
                    <ul className="flex flex-col gap-3">
                    {messages.map((m) => {
                      const read = messageReadByPeers(m, msgThreadCaps);
                      if (m.deletedForEveryone) {
                        return (
                          <li
                            key={m.id}
                            id={`school-chat-msg-${m.id}`}
                            className="flex justify-center py-0.5"
                          >
                            <span className="rounded-full border border-border/50 bg-muted/40 px-4 py-1.5 font-mono text-[11px] italic text-muted-foreground">
                              {t("chat.message.deletedStub")}
                            </span>
                          </li>
                        );
                      }
                      return (
                      <li
                        key={m.id}
                        id={`school-chat-msg-${m.id}`}
                        className={cn(
                          "flex max-w-[min(92%,560px)] gap-2",
                          m.fromSelf ? "ml-auto flex-row-reverse" : "mr-auto flex-row"
                        )}
                      >
                        {!m.fromSelf ?
                          <ChatAvatar
                            nome={m.sender.nome}
                            avatarUrl={m.sender.avatarUrl}
                            className="mt-0.5 size-8 shrink-0"
                          />
                        : null}
                        <div
                          className={cn(
                            "relative flex min-w-0 flex-1 flex-col gap-1 rounded-2xl border px-3 py-2 text-sm shadow-sm",
                            m.fromSelf ?
                              "border-primary/25 bg-primary/10"
                            : "border-border/70 bg-card"
                          )}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                              {!m.fromSelf ?
                                <span className="min-w-0 truncate font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                                  {m.sender.nome}
                                </span>
                              : null}
                              {m.pinnedAt ?
                                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide text-amber-900 dark:text-amber-300">
                                  <Pin className="h-3 w-3 shrink-0" />
                                  {t("chat.message.pinnedBadge")}
                                </span>
                              : null}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                                  aria-label={t("chat.message.menu.aria")}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                {m.pinnedAt ?
                                  <DropdownMenuItem
                                    onClick={() => void toggleMessagePin(m, false)}
                                  >
                                    <PinOff className="mr-2 h-3.5 w-3.5" />
                                    {t("chat.message.unpin")}
                                  </DropdownMenuItem>
                                : <DropdownMenuItem
                                    onClick={() => void toggleMessagePin(m, true)}
                                  >
                                    <Pin className="mr-2 h-3.5 w-3.5" />
                                    {t("chat.message.pin")}
                                  </DropdownMenuItem>}
                                {m.fromSelf ?
                                  <DropdownMenuItem onClick={() => openEditMessage(m)}>
                                    <Pencil className="mr-2 h-3.5 w-3.5" />
                                    {t("chat.message.edit")}
                                  </DropdownMenuItem>
                                : null}
                                {m.attachmentUrl ?
                                  <DropdownMenuItem
                                    onClick={() =>
                                      void downloadChatMedia(
                                        m.attachmentUrl!,
                                        m.attachmentName ?? t("chat.fileFallback"),
                                        t("chat.fileFallback")
                                      )
                                    }
                                  >
                                    <Download className="mr-2 h-3.5 w-3.5" />
                                    {t("chat.message.downloadFile")}
                                  </DropdownMenuItem>
                                : null}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => void deleteMessageRow(m, "me")}
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                                  {t("chat.message.deleteForMe")}
                                </DropdownMenuItem>
                                {m.fromSelf ?
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => void deleteMessageRow(m, "all")}
                                  >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                    {t("chat.message.deleteForAll")}
                                  </DropdownMenuItem>
                                : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
                            {m.body}
                          </p>
                          {m.attachmentUrl ?
                            <div className="flex flex-wrap items-center gap-2">
                              {isLikelyChatImage(m.attachmentUrl, m.attachmentName) ?
                                <button
                                  type="button"
                                  className="block overflow-hidden rounded-xl border border-border/60 bg-muted/40 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  onClick={() =>
                                    window.open(m.attachmentUrl!, "_blank", "noopener,noreferrer")
                                  }
                                >
                                  <img
                                    src={m.attachmentUrl}
                                    alt=""
                                    className="max-h-52 max-w-full object-cover"
                                  />
                                </button>
                              : null}
                              <a
                                href={m.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                              >
                                📎 {m.attachmentName ?? t("chat.fileGeneric")}
                              </a>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 gap-1 rounded-lg px-2 text-[11px]"
                                onClick={() =>
                                  void downloadChatMedia(
                                    m.attachmentUrl!,
                                    m.attachmentName ?? t("chat.fileFallback"),
                                    t("chat.fileFallback")
                                  )
                                }
                              >
                                <Download className="h-3.5 w-3.5" />
                                {t("chat.message.downloadShort")}
                              </Button>
                            </div>
                          : null}
                          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 font-mono text-[10px] text-muted-foreground">
                            <span>
                              {new Date(m.createdAt).toLocaleString(localeTag, {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {m.editedAt ?
                                <span
                                  className="italic text-muted-foreground/90"
                                  title={t("chat.message.editedTitle")}
                                >
                                  {t("chat.message.editedSuffix")}
                                </span>
                              : null}
                            </span>
                            {m.fromSelf ?
                              <span
                                className={cn(
                                  "inline-flex shrink-0 items-center gap-0.5",
                                  read ?
                                    "text-sky-500 dark:text-sky-400"
                                  : "text-muted-foreground/55"
                                )}
                                title={
                                  read ?
                                    capsKind === "group" ?
                                      t("chat.readReceipt.group")
                                    : t("chat.readReceipt.direct")
                                  : t("chat.readReceipt.pending")
                                }
                              >
                                <CheckCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                              </span>
                            : null}
                          </div>
                        </div>
                      </li>
                      );
                    })}
                    <div ref={bottomRef} />
                  </ul>
                </>
                }
              </ScrollArea>

              <footer className="border-t border-border/60 bg-background/90 p-3 backdrop-blur">
                {!viewerCanPost ?
                  <p className="mb-3 flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-[12px] text-muted-foreground">
                    <Lock className="h-3.5 w-3.5 shrink-0" />
                    {t("chat.composer.readOnlyBanner")}
                  </p>
                : null}
                <input ref={fileRef} type="file" className="hidden" />
                <div className="flex flex-wrap items-end gap-2 opacity-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 rounded-xl"
                    disabled={!viewerCanPost}
                    onClick={() => fileRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={
                      viewerCanPost
                        ? t("chat.composer.placeholder.write")
                        : t("chat.composer.placeholder.readonly")
                    }
                    disabled={!viewerCanPost}
                    className="min-w-[120px] flex-1 rounded-xl border-border/70 bg-muted/30 font-[inherit]"
                    onKeyDown={(e) => {
                      if (!viewerCanPost) return;
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    className="shrink-0 rounded-xl gap-2"
                    disabled={sending || !viewerCanPost}
                    onClick={() => void sendMessage()}
                  >
                    {sending ?
                      <Loader2 className="h-4 w-4 animate-spin" />
                    : <Send className="h-4 w-4" />}
                    {t("chat.composer.send")}
                  </Button>
                </div>
                {viewerCanPost ?
                  <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                    {t("chat.composer.attachHint")}
                  </p>
                : null}
              </footer>
            </>
          }
        </section>
      </div>

      <Dialog
        open={mediaOpen}
        onOpenChange={(open) => {
          setMediaOpen(open);
          if (!open) setMediaPreview(null);
        }}
      >
        <DialogContent className="max-h-[min(640px,88vh)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("chat.mediaDialog.title")}</DialogTitle>
            <DialogDescription>{t("chat.mediaDialog.desc")}</DialogDescription>
          </DialogHeader>
          {mediaLoading ?
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          : mediaItems.length === 0 ?
            <p className="py-10 text-center text-sm text-muted-foreground">
              {t("chat.mediaDialog.empty")}
            </p>
          : <ScrollArea className="max-h-[min(440px,60vh)] pr-3">
              <div className="grid grid-cols-3 gap-2 pb-2">
                {mediaItems.map((item) => {
                  const url = item.attachmentUrl ?? "";
                  const img = Boolean(
                    url && isLikelyChatImage(url, item.attachmentName)
                  );
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="group relative flex aspect-square flex-col overflow-hidden rounded-xl border border-border/60 bg-muted/40 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() =>
                        img && url ?
                          setMediaPreview(item)
                        : url ?
                          window.open(url, "_blank", "noopener,noreferrer")
                        : undefined
                      }
                    >
                      {img && url ?
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      : <div className="flex h-full flex-col justify-between gap-1 p-2">
                          <span className="line-clamp-3 font-mono text-[10px] font-semibold leading-tight">
                            {item.attachmentName ?? t("chat.fileGeneric")}
                          </span>
                          <span className="font-mono text-[9px] text-muted-foreground">
                            {item.senderNome}
                          </span>
                        </div>
                      }
                      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="block truncate font-mono text-[9px] text-white">
                          {new Date(item.createdAt).toLocaleDateString(localeTag)}{" "}
                          {t("chat.meta.sep")}
                          {item.fromSelf ? t("chat.you") : item.senderNome}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          }
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(mediaPreview?.attachmentUrl)}
        onOpenChange={(open) => {
          if (!open) setMediaPreview(null);
        }}
      >
        <DialogContent className="max-w-[min(96vw,900px)] border-none bg-transparent p-4 shadow-none sm:rounded-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{t("chat.previewDialog.title")}</DialogTitle>
          </DialogHeader>
          {mediaPreview?.attachmentUrl ?
            <>
              <img
                src={mediaPreview.attachmentUrl}
                alt=""
                className="max-h-[min(78vh,720px)] w-full rounded-xl border border-border/60 bg-background object-contain shadow-lg"
              />
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl bg-background/95"
                  onClick={() =>
                    void downloadChatMedia(
                      mediaPreview.attachmentUrl!,
                      mediaPreview.attachmentName ?? t("chat.imageFallback"),
                      t("chat.fileFallback")
                    )
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t("chat.message.downloadShort")}
                </Button>
                <Button
                  type="button"
                  className="rounded-xl"
                  onClick={() =>
                    window.open(
                      mediaPreview.attachmentUrl!,
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                >
                  {t("chat.preview.openNewTab")}
                </Button>
              </div>
            </>
          : null}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("chat.editDialog.title")}</DialogTitle>
            <DialogDescription>{t("chat.editDialog.desc")}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            rows={5}
            className="rounded-xl font-[inherit] text-sm"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setEditOpen(false)}
            >
              {t("chat.dialog.cancel")}
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={savingEdit}
              onClick={() => void saveEditedMessage()}
            >
              {savingEdit ?
                <Loader2 className="h-4 w-4 animate-spin" />
              : t("chat.dialog.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
