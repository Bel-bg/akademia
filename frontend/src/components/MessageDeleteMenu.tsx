import { KeyboardEvent, useState } from 'react';
import { MoreVertical } from 'lucide-react';

interface Props {
  label: string;
  onDeleteForMe(): void;
  onDeleteForEveryone(): void;
  disabled?: boolean;
}

export default function MessageDeleteMenu({ label, onDeleteForMe, onDeleteForEveryone, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const closeOnEscape = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') setOpen(false);
  };

  return (
    <div className="relative shrink-0" onKeyDown={closeOnEscape}>
      <button
        type="button"
        className="btn btn-ghost !px-2 text-muted"
        aria-label={`Options de suppression : ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreVertical size={17} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 min-w-52 rounded-lg border border-line bg-card p-1 shadow-card">
          <button type="button" role="menuitem" className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-soft" onClick={() => { setOpen(false); onDeleteForMe(); }}>
            Supprimer pour moi
          </button>
          <button type="button" role="menuitem" className="w-full rounded-md px-3 py-2 text-left text-sm text-bad hover:bg-bad/10" onClick={() => { setOpen(false); onDeleteForEveryone(); }}>
            Supprimer définitivement pour tous
          </button>
        </div>
      )}
    </div>
  );
}