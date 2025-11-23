import { WorkspaceLayout } from '../workspace/WorkspaceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Users } from 'lucide-react';

export default function ModuleUsersPage() {
  return (
    <WorkspaceLayout>
      <div className="w-full">
        <div className="bg-muted/30 border-b border-border">
          <div className="w-full px-8 py-8">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-purple-500" />
              <h1 className="text-4xl font-bold">Gestão de Usuários</h1>
            </div>
            <p className="text-muted-foreground">
              Controle de acessos e permissões
            </p>
          </div>
        </div>
        <div className="w-full px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Módulo em Desenvolvimento</CardTitle>
              <CardDescription>
                Em breve: controle de acesso, permissões, perfis de usuário, logs de acesso
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </WorkspaceLayout>
  );
}