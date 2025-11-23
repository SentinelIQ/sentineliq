import { useState, useEffect } from 'react';

/**
 * Hook para gerenciar estado de onboarding
 * Usa localStorage para persistir se o usuário já completou o tour
 */
export const useOnboarding = (tourKey: string) => {
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem(`onboarding_${tourKey}_completed`);
    if (!hasCompletedTour) {
      // Delay de 500ms para garantir que o DOM está pronto
      setTimeout(() => {
        setRunTour(true);
      }, 500);
    }
  }, [tourKey]);

  const completeTour = () => {
    localStorage.setItem(`onboarding_${tourKey}_completed`, 'true');
    setRunTour(false);
    setStepIndex(0);
  };

  const skipTour = () => {
    completeTour();
  };

  const resetTour = () => {
    localStorage.removeItem(`onboarding_${tourKey}_completed`);
    setStepIndex(0);
    setTimeout(() => {
      setRunTour(true);
    }, 300);
  };

  return {
    runTour,
    stepIndex,
    setStepIndex,
    completeTour,
    skipTour,
    resetTour,
  };
};
