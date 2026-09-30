import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

// Below `md` the links sit behind a menu button (aria-expanded, closes on Escape);
// from `md` up they are always visible.
export function NavMenu({
  label,
  tone = 'dark',
  children,
}: {
  label: string;
  tone?: 'dark' | 'light';
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    // Choosing a link or button inside the open menu closes it.
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (panelRef.current?.contains(target) && target.closest('a,button')) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onClick);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={[
          'inline-flex h-11 w-11 items-center justify-center rounded-md md:hidden',
          tone === 'light'
            ? 'text-white hover:bg-ink-700'
            : 'text-neutral-800 hover:bg-neutral-100',
        ].join(' ')}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sr-only">{open ? `Close ${label}` : `Open ${label}`}</span>
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      <nav
        id={panelId}
        ref={panelRef}
        aria-label={label}
        className={[
          open ? 'flex' : 'hidden',
          'absolute inset-x-0 top-full flex-col gap-1 border-b p-4 shadow-card md:static md:flex md:flex-row md:items-center md:gap-2 md:border-0 md:bg-transparent md:p-0 md:shadow-none',
          tone === 'light' ? 'border-ink-700 bg-ink' : 'border-neutral-200 bg-white',
        ].join(' ')}
      >
        {children}
      </nav>
    </>
  );
}
