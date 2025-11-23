import { useQuery } from 'wasp/client/operations';
import { getCurrentWorkspace } from 'wasp/client/operations';

interface UseWorkspaceReturn {
  currentWorkspace: any | null;
  members?: any[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to get current workspace
 */
export function useWorkspace(): UseWorkspaceReturn {
  const { data: currentWorkspace, isLoading, error, refetch } = useQuery(getCurrentWorkspace);

  return {
    currentWorkspace: currentWorkspace || null,
    members: currentWorkspace?.members || [],
    isLoading,
    error: error || null,
    refetch,
  };
}

export default useWorkspace;
