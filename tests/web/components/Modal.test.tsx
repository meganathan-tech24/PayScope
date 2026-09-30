import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Modal } from '@web/components/ui/Modal';

function Harness({ onClose = () => undefined }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      {open ? (
        <Modal
          title="Edit thing"
          onClose={() => {
            onClose();
            setOpen(false);
          }}
        >
          <label>
            Name <input />
          </label>
          <button>Save</button>
        </Modal>
      ) : null}
    </>
  );
}

describe('Modal', () => {
  it('is a modal dialog labelled by its title, with focus moved to the first field', async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));

    const dialog = screen.getByRole('dialog', { name: 'Edit thing' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
  });

  it('closes on Escape and gives focus back to what opened it', async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const opener = screen.getByRole('button', { name: 'Open' });
    await userEvent.click(opener);

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('closes from the Close button', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps Tab and Shift+Tab inside the dialog', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    const input = screen.getByRole('textbox', { name: 'Name' });
    const save = screen.getByRole('button', { name: 'Save' });
    const close = screen.getByRole('button', { name: 'Close' });

    await userEvent.tab(); // input -> Save
    expect(save).toHaveFocus();
    await userEvent.tab(); // Save is last: wraps to the first focusable (Close)
    expect(close).toHaveFocus();
    await userEvent.tab({ shift: true }); // Close is first: wraps to the last (Save)
    expect(save).toHaveFocus();
    expect(input).toBeInTheDocument();
  });

  it('stops the page behind from scrolling, and restores it', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(document.body.style.overflow).toBe('hidden');

    await userEvent.keyboard('{Escape}');

    expect(document.body.style.overflow).not.toBe('hidden');
  });
});
