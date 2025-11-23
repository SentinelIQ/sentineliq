import { HttpError } from 'wasp/server';

type CreateWorkspaceData = {
  name: string;
  slug?: string;
};

export class WorkspaceService {
  /**
   * Check if user has access to workspace
   * Reusable across all modules
   */
  static async checkWorkspaceAccess(
    context: any,
    workspaceId: string,
    requiredRole?: 'OWNER' | 'ADMIN' | 'MEMBER'
  ) {
    if (!context.user) {
      throw new HttpError(401, 'Unauthorized');
    }

    const member = await context.entities.WorkspaceMember.findFirst({
      where: {
        userId: context.user.id,
        workspaceId,
      },
    });

    if (!member) {
      throw new HttpError(403, 'Access denied to this workspace');
    }

    // Check role if required
    if (requiredRole) {
      const roleHierarchy = { OWNER: 3, ADMIN: 2, MEMBER: 1 };
      const userRoleLevel = roleHierarchy[member.role as keyof typeof roleHierarchy] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole];

      if (userRoleLevel < requiredRoleLevel) {
        throw new HttpError(403, `Requires ${requiredRole} role`);
      }
    }

    return member;
  }
  static async createWorkspace(data: CreateWorkspaceData, userId: string, entities: any) {
    const slug = data.slug || this.generateSlug(data.name);
    
    // Verificar se slug já existe
    const existing = await entities.Workspace.findUnique({ where: { slug } });
    if (existing) {
      throw new HttpError(400, 'Workspace slug already exists');
    }
    
    // Criar workspace e adicionar owner como membro
    const workspace = await entities.Workspace.create({
      data: {
        name: data.name,
        slug,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'OWNER'
          }
        }
      },
      include: {
        owner: true,
        members: true
      }
    });
    
    return workspace;
  }
  
  static async switchWorkspace(workspaceId: string, userId: string, entities: any) {
    // Verificar se usuário tem acesso ao workspace
    const member = await entities.WorkspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId
        }
      }
    });
    
    if (!member) {
      throw new HttpError(403, 'No access to this workspace');
    }
    
    // Atualizar workspace atual do usuário
    return entities.User.update({
      where: { id: userId },
      data: { currentWorkspaceId: workspaceId }
    });
  }
  
  static async completeOnboarding(data: CreateWorkspaceData, userId: string, entities: any) {
    // Criar workspace
    const workspace = await this.createWorkspace(data, userId, entities);
    
    // Marcar onboarding como completo e definir workspace atual
    const user = await entities.User.update({
      where: { id: userId },
      data: {
        hasCompletedOnboarding: true,
        currentWorkspaceId: workspace.id
      }
    });
    
    return user;
  }
  
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Math.random().toString(36).substr(2, 6);
  }
}
