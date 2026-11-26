import { useState } from 'preact/hooks';
import { Trash2 } from 'lucide-preact';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/cn';
import { dict, dumps, makeId, removeDump, saveDump } from '../../state/store';

function formatDumpDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`;
}

export function BrainDump() {
  const copy = dict.value;
  const [text, setText] = useState('');
  const [dissolving, setDissolving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleRelease = () => {
    if (!text.trim() || dissolving) return;
    setDissolving(true);
    setNotice(null);
    window.setTimeout(() => {
      setText('');
      setDissolving(false);
      setNotice(copy.ledger.releasedNotice);
    }, 480);
  };

  const handleArchive = async () => {
    const clean = text.trim();
    if (!clean || dissolving) return;
    setNotice(null);
    await saveDump({
      id: makeId('dump'),
      content: clean,
      createdAt: Date.now(),
    });
    setText('');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-serif text-2xl tracking-tight text-[var(--ink)]">
          {copy.ledger.dumpTitle}
        </h2>
        <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
          {copy.ledger.dumpSubtitle}
        </p>
      </div>

      <div className="space-y-3">
        <textarea
          rows={6}
          value={text}
          onInput={(e) => {
            setNotice(null);
            setText((e.target as HTMLTextAreaElement).value);
          }}
          placeholder={copy.ledger.dumpPlaceholder}
          className={cn(
            'paper-note w-full resize-y p-4 text-sm leading-relaxed text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none transition-opacity duration-500 ease-tactile',
            dissolving ? 'opacity-0' : 'opacity-100'
          )}
        />

        {notice && (
          <p className="font-mono text-xs text-[var(--accent)]">{notice}</p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="warn"
            onClick={handleRelease}
            disabled={!text.trim() || dissolving}
          >
            {copy.ledger.releaseErase}
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleArchive()}
            disabled={!text.trim() || dissolving}
          >
            {copy.ledger.archiveLocal}
          </Button>
        </div>
      </div>

      <div className="space-y-3 border-t border-[var(--border)] pt-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
          {copy.ledger.archiveTitle}
        </p>

        {dumps.value.length === 0 ? (
          <div className="paper-note p-5 text-center text-xs text-[var(--ink-muted)]">
            {copy.ledger.emptyArchive}
          </div>
        ) : (
          <ul className="space-y-2.5">
            {dumps.value.map((dump) => (
              <li
                key={dump.id}
                className="paper-note flex items-start justify-between gap-3 p-4"
              >
                <div className="min-w-0 space-y-1.5">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">
                    {dump.content}
                  </p>
                  <p className="font-mono text-[10px] text-[var(--ink-muted)] tabular-nums">
                    {formatDumpDate(dump.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void removeDump(dump.id)}
                  aria-label={copy.plan.delete}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] text-[var(--ink-muted)] hover:bg-[var(--bg)] hover:text-[var(--warn)] cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
