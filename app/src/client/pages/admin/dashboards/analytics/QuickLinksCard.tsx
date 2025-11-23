import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Bell, FileText, MessageSquare, Shield } from 'lucide-react';

export default function QuickLinksCard() {
  const links = [
    {
      title: 'System Logs',
      description: 'View technical logs',
      icon: FileText,
      href: '/admin/logs',
      color: 'text-blue-500',
    },
    {
      title: 'Messages',
      description: 'Contact form messages',
      icon: MessageSquare,
      href: '/admin/messages',
      color: 'text-green-500',
    },
  ];

  return (
    <Card className="col-span-12 xl:col-span-4">
      <CardHeader>
        <CardTitle>Quick Access</CardTitle>
        <CardDescription>Navigate to system management pages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {links.map((link) => (
            <Link key={link.href} to={link.href}>
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3"
              >
                <link.icon className={`mr-3 h-5 w-5 ${link.color}`} />
                <div className="text-left">
                  <div className="font-medium">{link.title}</div>
                  <div className="text-xs text-muted-foreground">{link.description}</div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
