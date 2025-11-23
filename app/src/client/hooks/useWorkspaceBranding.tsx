import { useQuery, getCurrentWorkspace } from 'wasp/client/operations';

interface WorkspaceBranding {
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  name?: string;
}

export function useWorkspaceBranding(): WorkspaceBranding {
  const { data: workspace } = useQuery(getCurrentWorkspace);

  if (!workspace) {
    return {};
  }

  return {
    logoUrl: workspace.logoUrl,
    primaryColor: workspace.primaryColor,
    secondaryColor: workspace.secondaryColor,
    name: workspace.name,
  };
}
