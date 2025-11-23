import { type AuthUser } from 'wasp/auth';
import { useTranslation } from 'react-i18next';
import UsersTable from './UsersTable';
import Breadcrumb from '../../layout/Breadcrumb';
import DefaultLayout from '../../layout/DefaultLayout';

const Users = ({ user }: { user: AuthUser }) => {
  const { t } = useTranslation('admin');
  
  return (
    <DefaultLayout user={user}>
      <Breadcrumb pageName={t('users.title')} />
      <div className='flex flex-col gap-10'>
        <UsersTable />
      </div>
    </DefaultLayout>
  );
};

export default Users;
