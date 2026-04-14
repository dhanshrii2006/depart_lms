import { useEffect } from 'react';
import { useMe, useUpdateProfile } from '../hooks/index.js';
import { Card, Input, Button, Loading, Textarea } from '../components/ui.jsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  bio: z.string().optional().default(''),
  avatarUrl: z.string().optional().default(''),
});

export default function Profile() {
  const { data: user, isLoading } = useMe();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.first_name,
        lastName: user.last_name,
        bio: user.bio || '',
        avatarUrl: user.avatar_url || '',
      });
    }
  }, [user, reset]);

  const onSubmit = (data) => {
    updateProfile(data, {
      onSuccess: () => {
        toast.success('Profile updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update profile');
      },
    });
  };

  if (isLoading) return <Loading />;

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Account Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  {...register('firstName')}
                  error={errors.firstName?.message}
                />
                <Input
                  label="Last Name"
                  {...register('lastName')}
                  error={errors.lastName?.message}
                />
              </div>
              <div className="bg-gray-100 px-4 py-2 rounded-lg text-sm text-gray-600">
                Email: {user?.email}
              </div>
              {user?.roll_number && (
                <div className="bg-gray-100 px-4 py-2 rounded-lg text-sm text-gray-600">
                  Roll Number: {user.roll_number}
                </div>
              )}
              <div className="bg-gray-100 px-4 py-2 rounded-lg text-sm text-gray-600 capitalize">
                Role: {user?.role}
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Information</h3>
            <div className="space-y-4">
              <Input
                label="Avatar URL"
                placeholder="https://example.com/avatar.jpg"
                {...register('avatarUrl')}
                error={errors.avatarUrl?.message}
              />
              <Textarea
                label="Bio"
                placeholder="Tell us about yourself..."
                rows="4"
                {...register('bio')}
                error={errors.bio?.message}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t">
            <Button variant="secondary">Cancel</Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
