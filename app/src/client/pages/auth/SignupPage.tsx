import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { SignupForm } from 'wasp/client/auth';
import { AuthPageLayout } from './AuthPageLayout';
import { PasswordStrengthMeter } from '../../components/PasswordStrengthMeter';

export function Signup() {
  const { t } = useTranslation('auth');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Monitor password input changes
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    if (passwordInput) {
      const handlePasswordChange = (e: Event) => {
        setPassword((e.target as HTMLInputElement).value);
      };
      passwordInput.addEventListener('input', handlePasswordChange);
      return () => passwordInput.removeEventListener('input', handlePasswordChange);
    }
  }, []);

  return (
    <AuthPageLayout>
      <SignupForm />
      {password && (
        <div className="mt-2 mb-4">
          <PasswordStrengthMeter password={password} />
        </div>
      )}
      <br />
      <span className='text-sm font-medium text-gray-900'>
        {t('signup.hasAccount')} (
        <WaspRouterLink to={routes.LoginRoute.to} className='underline'>
          {t('signup.loginLink')}
        </WaspRouterLink>
        ).
      </span>
      <br />
    </AuthPageLayout>
  );
}
