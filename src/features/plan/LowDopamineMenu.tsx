import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Pencil, Plus, Shuffle, Trash2 } from 'lucide-preact';
import { SproutDoodle } from '../../components/Doodles';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import type { LowDopamineItem, MenuDuration, MenuEnergy } from '../../db/types';
import { cn } from '../../lib/cn';
import {
  autoPickNonce,
  dict,
  makeId,
  menuItems,
  removeMenuItem,
  saveMenuItem,
} from '../../state/store';

const DURATIONS: MenuDuration[] = ['short', 'medium', 'long'];
const ENERGIES: MenuEnergy[] = ['low', 'normal', 'high'];

export function LowDopamineMenu() {
  const copy = dict.value;
  const [durationFilter, setDurationFilter] = useState<'all' | MenuDuration>('all');
  const [energyFilter, setEnergyFilter] = useState<'all' | MenuEnergy>('all');
  const [pickedId, setPickedId] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LowDopamineItem | null>(null);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState<MenuDuration>('short');
  const [energy, setEnergy] = useState<MenuEnergy>('normal');

  const filtered = useMemo(() => {
    return menuItems.value.filter((item) => {
      if (durationFilter !== 'all' && item.duration !== durationFilter) return false;
      if (energyFilter !== 'all' && item.energy !== energyFilter) return false;
      return true;
    });
  }, [menuItems.value, durationFilter, energyFilter]);

  const pickedItem = useMemo(
    () => filtered.find((item) => item.id === pickedId) ?? null,
    [filtered, pickedId]
  );

  const pickOne = () => {
    if (filtered.length === 0) {
      setPickedId(null);
      return;
    }
    const pool =
      filtered.length > 1 && pickedId
        ? filtered.filter((item) => item.id !== pickedId)
        : filtered;
    const choice = pool[Math.floor(Math.random() * pool.length)];
    setPickedId(choice.id);
  };

  const handledNonceRef = useRef(0);
  useEffect(() => {
    const nonce = autoPickNonce.value;
    if (nonce > 0 && nonce !== handledNonceRef.current) {
      handledNonceRef.current = nonce;
      if (menuItems.value.length > 0) {
        const pool =
          menuItems.value.length > 1 && pickedId
            ? menuItems.value.filter((item) => item.id !== pickedId)
            : menuItems.value;
        const choice = pool[Math.floor(Math.random() * pool.length)];
        setDurationFilter('all');
        setEnergyFilter('all');
        setPickedId(choice.id);
      }
    }
  }, [autoPickNonce.value]);

  const openNew = () => {
    setEditing(null);
    setTitle('');
    setDuration(durationFilter === 'all' ? 'short' : durationFilter);
    setEnergy(energyFilter === 'all' ? 'normal' : energyFilter);
    setDialogOpen(true);
  };

  const openEdit = (item: LowDopamineItem) => {
    setEditing(item);
    setTitle(item.title);
    setDuration(item.duration);
    setEnergy(item.energy);
    setDialogOpen(true);
  };

  const handleSave = async (e: Event) => {
    e.preventDefault();
    const clean = title.trim();
    if (!clean) return;
    await saveMenuItem({
      id: editing?.id ?? makeId('menu'),
      title: clean,
      duration,
      energy,
      createdAt: editing?.createdAt ?? Date.now(),
    });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <SproutDoodle className="h-10 w-10 shrink-0" />
          <div className="space-y-1">
            <h2 className="font-serif text-2xl tracking-tight text-[var(--ink)]">
              {copy.plan.menuTitle}
            </h2>
            <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
              {copy.plan.menuSubtitle}
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={openNew} className="shrink-0">
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>{copy.plan.addActivity}</span>
        </Button>
      </div>

      <div className="paper-card space-y-3 p-4">
        <div className="space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {copy.plan.durationFilter}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(['all', ...DURATIONS] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDurationFilter(d)}
                className={cn(
                  'rounded-[2px] border px-2.5 py-1 font-mono text-[11px] cursor-pointer',
                  durationFilter === d
                    ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]'
                    : 'border-[var(--border)] bg-[var(--bg)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                )}
              >
                {d === 'all' ? copy.plan.all : copy.plan.durations[d]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {copy.plan.energyFilter}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(['all', ...ENERGIES] as const).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEnergyFilter(e)}
                className={cn(
                  'rounded-[2px] border px-2.5 py-1 font-mono text-[11px] cursor-pointer',
                  energyFilter === e
                    ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]'
                    : 'border-[var(--border)] bg-[var(--bg)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                )}
              >
                {e === 'all' ? copy.plan.all : copy.plan.energies[e]}
              </button>
            ))}
          </div>
        </div>

        <Button
          variant="primary"
          onClick={pickOne}
          disabled={filtered.length === 0}
          className="w-full"
        >
          <Shuffle className="h-4 w-4" strokeWidth={1.5} />
          <span>{pickedItem ? copy.plan.pickAnother : copy.plan.pickOne}</span>
        </Button>
      </div>

      {pickedItem && (
        <div className="paper-card border-[var(--accent)] p-4 space-y-2">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
            {copy.plan.pickedHeading}
          </p>
          <p className="font-serif text-2xl leading-snug text-[var(--ink)]">
            {pickedItem.title}
          </p>
          <div className="flex gap-2 font-mono text-[11px] text-[var(--ink-muted)]">
            <span>{copy.plan.durations[pickedItem.duration]}</span>
            <span>·</span>
            <span>{copy.plan.energies[pickedItem.energy]}</span>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="paper-note p-6 text-center text-xs text-[var(--ink-muted)]">
          {copy.plan.emptyMenu}
        </div>
      ) : (
        <ul className="paper-card divide-y divide-dashed divide-[var(--border)]">
          {filtered.map((item) => (
            <li
              key={item.id}
              className={cn(
                'flex items-center justify-between gap-3 px-4 py-3',
                pickedItem?.id === item.id && 'bg-[var(--surface-2)]'
              )}
            >
              <div className="min-w-0 space-y-1">
                <p className="text-sm text-[var(--ink)]">{item.title}</p>
                <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                  {copy.plan.durations[item.duration]} · {copy.plan.energies[item.energy]}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  aria-label={copy.plan.edit}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[3px] text-[var(--ink-muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)] cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => void removeMenuItem(item.id)}
                  aria-label={copy.plan.delete}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[3px] text-[var(--ink-muted)] hover:bg-[var(--bg)] hover:text-[var(--warn)] cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? copy.plan.editActivity : copy.plan.addActivity}
      >
        <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="menu-title"
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]"
            >
              {copy.plan.activityTitle}
            </label>
            <input
              id="menu-title"
              type="text"
              required
              value={title}
              onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
              placeholder={copy.plan.activityTitlePlaceholder}
              className="h-10 w-full rounded-[3px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              {copy.plan.durationFilter}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={cn(
                    'h-9 rounded-[3px] border font-mono text-xs cursor-pointer',
                    duration === d
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]'
                  )}
                >
                  {copy.plan.durations[d]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              {copy.plan.energyFilter}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {ENERGIES.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEnergy(e)}
                  className={cn(
                    'h-9 rounded-[3px] border font-mono text-xs cursor-pointer',
                    energy === e
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]'
                  )}
                >
                  {copy.plan.energies[e]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setDialogOpen(false)}
              className="flex-1"
            >
              {copy.plan.cancel}
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {copy.plan.save}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
