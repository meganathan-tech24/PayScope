import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Alert } from '@web/components/ui/Alert';
import { Button } from '@web/components/ui/Button';
import { RadioCardGroup } from '@web/components/ui/RadioCardGroup';
import { TextField } from '@web/components/ui/TextField';

describe('Button', () => {
  it('is disabled and marked busy while loading, and ignores clicks', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );

    const button = screen.getByRole('button', { name: /save/i });
    await userEvent.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is a normal enabled button by default', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });
});

describe('TextField', () => {
  it('labels the input and connects the hint and the error to it', () => {
    render(<TextField label="Email" hint="Work address" error="Invalid email address" />);

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Work address Invalid email address');
  });

  it('is not marked invalid without an error', () => {
    render(<TextField label="Email" />);

    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');
  });
});

describe('Alert', () => {
  it('interrupts for errors and is polite for info', () => {
    render(
      <>
        <Alert tone="error">Broken</Alert>
        <Alert tone="info">FYI</Alert>
      </>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Broken');
    expect(screen.getByRole('status')).toHaveTextContent('FYI');
  });
});

describe('RadioCardGroup', () => {
  function Harness() {
    const [value, setValue] = useState<'a' | 'b'>('a');
    return (
      <RadioCardGroup
        legend="Account type"
        name="type"
        value={value}
        onChange={setValue}
        options={[
          { value: 'a', label: 'Option A', description: 'About A' },
          { value: 'b', label: 'Option B', description: 'About B' },
        ]}
      />
    );
  }

  it('is a labelled radio group whose options carry their descriptions', () => {
    render(<Harness />);

    expect(screen.getByRole('group', { name: 'Account type' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Option A/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Option B/ })).toHaveAccessibleDescription('About B');
  });

  it('changes selection with a click and with the keyboard', async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole('radio', { name: /Option B/ }));
    expect(screen.getByRole('radio', { name: /Option B/ })).toBeChecked();

    screen.getByRole('radio', { name: /Option B/ }).focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('radio', { name: /Option A/ })).toBeChecked();
  });
});
