import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../../src/client/components/ui/input';
import { Label } from '../../src/client/components/ui/label';
import { Mail, Search } from 'lucide-react';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Type something...',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'name@example.com',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter your password',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
};

export const WithIcon: Story = {
  render: () => (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input placeholder="Search..." className="pl-8" />
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="required">
        Username <span className="text-destructive">*</span>
      </Label>
      <Input type="text" id="required" placeholder="Enter username" required />
      <p className="text-sm text-muted-foreground">This field is required</p>
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="error">Email</Label>
      <Input
        type="email"
        id="error"
        placeholder="name@example.com"
        className="border-destructive focus-visible:ring-destructive"
        aria-invalid="true"
      />
      <p className="text-sm text-destructive">Invalid email address</p>
    </div>
  ),
};
