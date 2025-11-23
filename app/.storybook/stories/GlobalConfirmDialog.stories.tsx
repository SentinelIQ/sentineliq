import type { Meta, StoryObj } from '@storybook/react';
import { GlobalConfirmDialog } from '../../src/client/components/GlobalConfirmDialog';
import { useConfirm } from '../../src/client/hooks/useConfirm';
import { Button } from '../../src/client/components/ui/button';

const meta: Meta<typeof GlobalConfirmDialog> = {
  title: 'Components/GlobalConfirmDialog',
  component: GlobalConfirmDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

function ConfirmExample({ variant = 'default', title, description, confirmText, cancelText }: {
  variant?: 'default' | 'warning' | 'destructive';
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}) {
  const { confirm } = useConfirm();

  const handleClick = async () => {
    const confirmed = await confirm({
      title,
      description,
      variant,
      confirmText,
      cancelText,
    });
    
    if (confirmed) {
      alert('Confirmed!');
    } else {
      alert('Cancelled!');
    }
  };

  return (
    <div>
      <Button onClick={handleClick} variant={variant === 'destructive' ? 'destructive' : 'default'}>
        Open Dialog
      </Button>
      <GlobalConfirmDialog />
    </div>
  );
}

export const Default: StoryObj = {
  render: () => (
    <ConfirmExample
      title="Confirm Action"
      description="Are you sure you want to proceed with this action?"
    />
  ),
};

export const Warning: StoryObj = {
  render: () => (
    <ConfirmExample
      variant="warning"
      title="Warning"
      description="This action may have unintended consequences. Please review before continuing."
      confirmText="Proceed Anyway"
    />
  ),
};

export const Destructive: StoryObj = {
  render: () => (
    <ConfirmExample
      variant="destructive"
      title="Delete Account"
      description="This will permanently delete your account and all associated data. This action cannot be undone."
      confirmText="Delete Forever"
      cancelText="Keep Account"
    />
  ),
};

export const DeleteWorkspace: StoryObj = {
  render: () => (
    <ConfirmExample
      variant="destructive"
      title="Delete Workspace?"
      description="All data, members, and settings will be permanently removed. This action is irreversible."
      confirmText="Delete Workspace"
    />
  ),
};

export const LeaveWorkspace: StoryObj = {
  render: () => (
    <ConfirmExample
      variant="warning"
      title="Leave Workspace?"
      description="You will lose access to all shared resources and projects in this workspace."
      confirmText="Leave"
      cancelText="Stay"
    />
  ),
};

export const SimpleConfirm: StoryObj = {
  render: () => (
    <ConfirmExample
      title="Are you sure?"
      confirmText="Yes"
      cancelText="No"
    />
  ),
};

export const CustomText: StoryObj = {
  render: () => (
    <ConfirmExample
      title="Save Changes?"
      description="You have unsaved changes. Would you like to save them before leaving?"
      confirmText="Save and Exit"
      cancelText="Discard Changes"
    />
  ),
};
