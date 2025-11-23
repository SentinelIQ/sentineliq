import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '../../src/client/components/ui/card';
import { Button } from '../../src/client/components/ui/button';
import { Bell } from 'lucide-react';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <CardTitle>Notifications</CardTitle>
        </div>
        <CardDescription>You have 3 unread messages.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Your subscription is expiring soon. Please renew to continue using all features.
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost">Dismiss</Button>
        <Button>View Details</Button>
      </CardFooter>
    </Card>
  ),
};

export const SimpleCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardContent className="pt-6">
        <p>A simple card with just content.</p>
      </CardContent>
    </Card>
  ),
};

export const NoFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Analytics Dashboard</CardTitle>
        <CardDescription>Overview of your workspace metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Members</span>
            <span className="font-bold">24</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Active Today</span>
            <span className="font-bold">12</span>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};
