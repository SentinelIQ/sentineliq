import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '../../src/client/components/ui/badge';
import { Check, X, AlertCircle } from 'lucide-react';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
      description: 'The visual style variant of the badge',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Destructive',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Check className="mr-1 h-3 w-3" />
        Verified
      </>
    ),
  },
};

export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>
        <Check className="mr-1 h-3 w-3" />
        Active
      </Badge>
      <Badge variant="secondary">
        <AlertCircle className="mr-1 h-3 w-3" />
        Pending
      </Badge>
      <Badge variant="destructive">
        <X className="mr-1 h-3 w-3" />
        Inactive
      </Badge>
    </div>
  ),
};

export const PlanBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Free</Badge>
      <Badge variant="secondary">Hobby</Badge>
      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">Pro</Badge>
      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">Enterprise</Badge>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};
