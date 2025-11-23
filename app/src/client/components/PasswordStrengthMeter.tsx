import React from 'react';
import { cn } from '../../lib/utils';

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

export function PasswordStrengthMeter({ password, className }: PasswordStrengthMeterProps) {
  // Calculate password strength (0-4)
  const calculateStrength = (pwd: string): number => {
    if (pwd.length === 0) return 0;
    if (pwd.length < 8) return 0;

    let strength = 0;
    
    // Length bonus
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    
    // Character variety
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    
    // Cap at 4
    return Math.min(strength, 4);
  };

  const strength = calculateStrength(password);

  const getStrengthLabel = (score: number): string => {
    switch (score) {
      case 0:
        return 'Very Weak';
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Strong';
      case 4:
        return 'Very Strong';
      default:
        return '';
    }
  };

  const getStrengthColor = (score: number): string => {
    switch (score) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  if (!password) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              strength >= level ? getStrengthColor(strength) : 'bg-gray-200 dark:bg-gray-700'
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={cn(
          'font-medium',
          strength <= 1 && 'text-red-600 dark:text-red-400',
          strength === 2 && 'text-orange-600 dark:text-orange-400',
          strength === 3 && 'text-yellow-600 dark:text-yellow-400',
          strength === 4 && 'text-green-600 dark:text-green-400'
        )}>
          {getStrengthLabel(strength)}
        </span>
        {strength < 3 && (
          <span className="text-muted-foreground">
            Use 12+ characters with mixed case, numbers & symbols
          </span>
        )}
      </div>
    </div>
  );
}
