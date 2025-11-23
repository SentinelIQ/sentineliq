import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from '../../src/client/components/EmptyState';
import { Button } from '../../src/client/components/ui/button';
import { Inbox, Users, FileText, Bell, Package } from 'lucide-react';

const meta: Meta<typeof EmptyState> = {
  title: 'Components/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'The title text',
    },
    description: {
      control: 'text',
      description: 'The description text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const NoNotifications: Story = {
  args: {
    icon: <Inbox className="h-16 w-16" />,
    title: 'No notifications yet',
    description: 'When you receive notifications, they will appear here.',
  },
};

export const NoMembers: Story = {
  args: {
    icon: <Users className="h-16 w-16" />,
    title: 'No members',
    description: 'Invite team members to collaborate on this workspace.',
    action: {
      label: 'Invite Members',
      onClick: () => alert('Invite members clicked'),
    },
  },
};

export const NoDocuments: Story = {
  args: {
    icon: <FileText className="h-16 w-16" />,
    title: 'No documents found',
    description: 'Upload your first document to get started with document management.',
    action: {
      label: 'Upload Document',
      onClick: () => alert('Upload clicked'),
    },
  },
};

export const NoData: Story = {
  args: {
    icon: <Package className="h-16 w-16" />,
    title: 'No data available',
    description: 'There is no data to display at the moment. Check back later or try refreshing the page.',
  },
};

export const WithoutIcon: Story = {
  args: {
    title: 'Getting Started',
    description: 'Complete your profile setup to unlock all features.',
    action: {
      label: 'Complete Setup',
      onClick: () => alert('Setup clicked'),
    },
  },
};

export const CustomAction: Story = {
  args: {
    icon: <Bell className="h-16 w-16" />,
    title: 'Enable Notifications',
    description: 'Stay updated with real-time notifications for important events.',
    action: {
      label: 'Enable Now',
      onClick: () => alert('Notifications enabled'),
    },
  },
};

export const LongDescription: Story = {
  args: {
    icon: <FileText className="h-16 w-16" />,
    title: 'No search results',
    description:
      'We couldn\'t find any items matching your search criteria. Try adjusting your filters or search terms to find what you\'re looking for.',
    action: {
      label: 'Clear Filters',
      onClick: () => alert('Filters cleared'),
    },
  },
};
