import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button, Input, Card } from '../../components/ui.jsx';
import { useLogin } from '../../hooks/index.js';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function TeacherLogin() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });
  const { mutate: login, isPending } = useLogin();

  const onSubmit = (data) => {
    login(data, {
      onSuccess: (response) => {
        if (response.data.user.role !== 'teacher') {
          toast.error('This login is for teachers only');
          return;
        }
        toast.success('Login successful!');
        navigate('/teacher/dashboard');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Login failed');
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">SVPCET</h1>
          <h2 className="text-2xl font-semibold text-gray-900">Teacher Login</h2>
          <p className="text-gray-600 mt-2">Sign in to manage your classrooms</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            {...register('email')}
            error={errors.email?.message}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            {...register('password')}
            error={errors.password?.message}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600 mb-3">Demo Credentials:</p>
          <p className="text-center text-xs text-gray-600 mb-3">
            Email: teacher1@acadify.com<br />
            Password: teacher123
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600 mb-3">Other logins:</p>
          <Link
            to="/student/login"
            className="block text-center text-indigo-600 hover:text-indigo-700 font-semibold mb-2"
          >
            Student Login
          </Link>
          <Link
            to="/admin/login"
            className="block text-center text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            Admin Login
          </Link>
        </div>
      </Card>
    </div>
  );
}
