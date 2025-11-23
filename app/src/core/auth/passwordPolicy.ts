import zxcvbn from 'zxcvbn';

export interface PasswordStrength {
  score: number; // 0-4 (weak to strong)
  feedback: {
    warning: string;
    suggestions: string[];
  };
  isValid: boolean;
  crackTime: string;
}

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MIN_SCORE = 3; // Require score of 3 or 4

/**
 * Validate password strength using zxcvbn
 * @param password - The password to validate
 * @param userInputs - Optional array of user-specific terms (email, name, etc) to check against
 * @returns PasswordStrength object with validation results
 */
export function validatePasswordStrength(
  password: string,
  userInputs: string[] = []
): PasswordStrength {
  // Basic length check
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      score: 0,
      feedback: {
        warning: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
        suggestions: ['Use a longer password with a mix of characters'],
      },
      isValid: false,
      crackTime: 'instant',
    };
  }

  // Use zxcvbn for advanced analysis
  const result = zxcvbn(password, userInputs);

  return {
    score: result.score,
    feedback: {
      warning: result.feedback.warning || '',
      suggestions: result.feedback.suggestions || [],
    },
    isValid: result.score >= PASSWORD_MIN_SCORE,
    crackTime: String(result.crack_times_display.offline_slow_hashing_1e4_per_second),
  };
}

/**
 * Get password strength label for UI display
 */
export function getPasswordStrengthLabel(score: number): string {
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
      return 'Unknown';
  }
}

/**
 * Get password strength color for UI display
 */
export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'red';
    case 2:
      return 'orange';
    case 3:
      return 'yellow';
    case 4:
      return 'green';
    default:
      return 'gray';
  }
}

/**
 * Additional password policy checks
 */
export interface PasswordPolicyCheck {
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export function checkPasswordPolicy(password: string): PasswordPolicyCheck {
  return {
    hasMinLength: password.length >= PASSWORD_MIN_LENGTH,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };
}

/**
 * Check if password contains common patterns
 */
export function hasCommonPatterns(password: string): boolean {
  const commonPatterns = [
    /^123/,
    /password/i,
    /qwerty/i,
    /admin/i,
    /letmein/i,
    /welcome/i,
  ];

  return commonPatterns.some((pattern) => pattern.test(password));
}
