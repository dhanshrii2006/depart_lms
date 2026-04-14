import { useNavigate } from 'react-router-dom';
import { Card, Button, Loading } from '../../components/ui.jsx';
import { useMe, useLogout } from '../../hooks/index.js';

export default function Settings() {
  const navigate = useNavigate();
  const { data: user, isLoading } = useMe();
  const { mutate: logout, isPending } = useLogout();

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Account and session settings</p>
      </div>

      <Card className="space-y-3">
        <div className="text-sm text-gray-700">
          <span className="font-medium">Email:</span> {user?.email}
        </div>
        <div className="text-sm text-gray-700 capitalize">
          <span className="font-medium">Role:</span> {user?.role}
        </div>
        {user?.roll_number && (
          <div className="text-sm text-gray-700">
            <span className="font-medium">Roll Number:</span> {user.roll_number}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button variant="secondary" onClick={() => navigate('/profile')}>
            Edit Profile
          </Button>
          <Button
            variant="primary"
            onClick={() => logout()}
            disabled={isPending}
          >
            {isPending ? 'Signing out...' : 'Sign out'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
