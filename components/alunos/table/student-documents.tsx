"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Trash2, Upload, ExternalLink } from "lucide-react";

const tipoLabel: Record<string, string> = {
  laudo: "Laudo",
  receita: "Receita",
  exame: "Exame",
  outro: "Outro",
};

const tipoColor: Record<string, string> = {
  laudo: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  receita: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  exame: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
  outro: "bg-muted text-muted-foreground border-border",
};

interface Documento {
  id: string;
  nome: string;
  tipo: string;
  url: string;
  tamanho: number | null;
  createdAt: string;
}

interface StudentDocumentsProps {
  alunoId: string;
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function StudentDocuments({ alunoId }: StudentDocumentsProps) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("laudo");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch(`/api/alunos/documentos?alunoId=${alunoId}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setDocumentos(data);
    } finally {
      setLoading(false);
    }
  }, [alunoId]);

  useEffect(() => {
    void fetchDocs();
  }, [fetchDocs]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Selecione um arquivo PDF."); return; }
    if (!nome.trim()) { setError("Informe um nome para o documento."); return; }

    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("alunoId", alunoId);
      fd.append("tipo", tipo);
      fd.append("nome", nome.trim());

      const res = await fetch("/api/alunos/documentos", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) { setError(data.error || "Erro ao fazer upload."); return; }

      setDocumentos((prev) => [data, ...prev]);
      setNome("");
      setTipo("laudo");
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
      setShowForm(false);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este documento?")) return;
    const res = await fetch("/api/alunos/documentos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setDocumentos((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Documentos</h4>
        <button
          onClick={() => { setShowForm((v) => !v); setError(""); }}
          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <Upload className="h-3 w-3" />
          Anexar
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleUpload} className="rounded-xl border border-border bg-background p-3 space-y-2 w-full overflow-hidden">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Nome do documento</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Laudo TEA 2024"
              className="w-48 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-32 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none"
            >
              <option value="laudo">Laudo</option>
              <option value="receita">Receita</option>
              <option value="exame">Exame</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Arquivo PDF (máx. 10MB)</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
            >
              <Upload className="h-3.5 w-3.5 shrink-0" />
              <span className="max-w-[160px] truncate">
                {fileName || "Selecionar PDF..."}
              </span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={() => {
                const file = fileRef.current?.files?.[0];
                if (file) {
                  setFileName(file.name);
                  setNome((prev) => prev || file.name.replace(/\.pdf$/i, ""));
                }
              }}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={uploading}
              className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-85 disabled:opacity-50"
            >
              {uploading ? "Enviando..." : "Enviar"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : documentos.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum documento anexado.</p>
      ) : (
        <div className="space-y-1.5 overflow-hidden">
          {documentos.map((doc) => (
            <div key={doc.id} className="flex items-center gap-2 rounded-lg border border-border/50 bg-background px-3 py-2 overflow-hidden">
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{doc.nome}</p>
                {doc.tamanho && (
                  <p className="text-xs text-muted-foreground">{formatBytes(doc.tamanho)}</p>
                )}
              </div>
              <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium ${tipoColor[doc.tipo] ?? tipoColor.outro}`}>
                {tipoLabel[doc.tipo] ?? doc.tipo}
              </span>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                title="Abrir documento"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={() => handleDelete(doc.id)}
                className="shrink-0 rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
                title="Remover documento"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
