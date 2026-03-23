/**
 * Password validation and strength checking
 */

export interface PasswordRequirements {
  minLength: boolean; // At least 8 characters
  uppercase: boolean; // At least 1 uppercase letter
  number: boolean; // At least 1 number
  specialChar: boolean; // At least 1 special character
}

export interface PasswordStrength {
  isValid: boolean;
  requirements: PasswordRequirements;
  strength: 'weak' | 'fair' | 'good' | 'strong';
  score: number; // 0-4 based on met requirements
}

/**
 * Check if password meets individual requirements
 */
export function checkPasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
}

/**
 * Calculate overall password strength
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  const requirements = checkPasswordRequirements(password);
  
  // Count how many requirements are met
  const metCount = Object.values(requirements).filter(Boolean).length;
  
  // Determine strength level
  let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
  if (metCount === 4) strength = 'strong';
  else if (metCount === 3) strength = 'good';
  else if (metCount === 2) strength = 'fair';
  
  // Password is valid only if ALL requirements are met
  const isValid = Object.values(requirements).every(Boolean);
  
  return {
    isValid,
    requirements,
    strength,
    score: metCount,
  };
}

/**
 * Get user-friendly label and color for strength
 */
export function getStrengthDisplay(strength: 'weak' | 'fair' | 'good' | 'strong') {
  switch (strength) {
    case 'strong':
      return { label: 'Strong', color: 'text-ev-success', bgColor: 'bg-ev-success/15', barColor: 'bg-ev-success' };
    case 'good':
      return { label: 'Good', color: 'text-ev-accent', bgColor: 'bg-ev-accent/15', barColor: 'bg-ev-accent' };
    case 'fair':
      return { label: 'Fair', color: 'text-ev-warning', bgColor: 'bg-ev-warning/15', barColor: 'bg-ev-warning' };
    case 'weak':
      return { label: 'Weak', color: 'text-ev-danger', bgColor: 'bg-ev-danger/15', barColor: 'bg-ev-danger' };
  }
}
