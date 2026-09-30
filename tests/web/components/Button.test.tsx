import { render, screen } from '@testing-library/react';
import { Download, Pencil, Trash2 } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { Button, IconButton } from '@web/components/ui/Button';

describe('Button', () => {
  it('renders the brand solid style by default, with its text label', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveClass('bg-brand-600', 'text-white');
    expect(button).toHaveClass('min-h-11');
  });

  it('renders export as a teal outline with an icon and a label', () => {
    render(
      <Button tone="download" look="outline" icon={Download}>
        Export CSV
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Export CSV' });
    expect(button).toHaveClass('border-download', 'text-download');
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders delete in the dialog as solid red', () => {
    render(
      <Button tone="danger" icon={Trash2}>
        Delete employee
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Delete employee' })).toHaveClass('bg-remove');
  });

  it('keeps the label while loading and blocks clicks', () => {
    render(<Button loading>Saving</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveTextContent('Saving');
  });

  it('is disabled with the shared button class, which greys it and shows not-allowed', () => {
    render(<Button disabled>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('btn');
  });

  it('keeps the older variant names working', () => {
    render(<Button variant="danger">Remove</Button>);
    expect(screen.getByRole('button', { name: 'Remove' })).toHaveClass('bg-remove');
  });
});

describe('IconButton', () => {
  it('needs a label: it is the accessible name and the tooltip', () => {
    render(<IconButton label="Edit Aarav Agarwal" icon={Pencil} tone="edit" />);
    const button = screen.getByRole('button', { name: 'Edit Aarav Agarwal' });
    expect(button).toHaveAttribute('title', 'Edit Aarav Agarwal');
    expect(button).toHaveClass('bg-edit-soft', 'text-edit-text');
  });

  it('renders delete as a soft red icon button', () => {
    render(<IconButton label="Delete Aarav Agarwal" icon={Trash2} tone="danger" />);
    expect(screen.getByRole('button', { name: 'Delete Aarav Agarwal' })).toHaveClass(
      'bg-remove-soft',
      'text-remove-text',
    );
  });

  it('is at least 44px on small screens', () => {
    render(<IconButton label="Edit" icon={Pencil} />);
    expect(screen.getByRole('button', { name: 'Edit' })).toHaveClass('h-11', 'w-11');
  });
});
