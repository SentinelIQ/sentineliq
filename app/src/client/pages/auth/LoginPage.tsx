import { useTranslation } from 'react-i18next';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { LoginForm } from 'wasp/client/auth';
import { AuthPageLayout } from './AuthPageLayout';

export default function Login() {
  const { t } = useTranslation('auth');
  
  return (
    <AuthPageLayout>
      <LoginForm />
      <br />
      <span className='text-sm font-medium text-gray-900 dark:text-gray-900'>
        {t('login.noAccount')}{' '}
        <WaspRouterLink to={routes.SignupRoute.to} className='underline'>
          {t('login.signupLink')}
        </WaspRouterLink>
        .
      </span>
      <br />
      <span className='text-sm font-medium text-gray-900'>
        {t('login.forgotPassword')}{' '}
        <WaspRouterLink to={routes.RequestPasswordResetRoute.to} className='underline'>
          {t('forgotPassword.title')}
        </WaspRouterLink>
        .
      </span>
    </AuthPageLayout>
  );
}
