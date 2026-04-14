import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/index.jsx';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f0f23] text-white flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">SVPCET</h1>
          <Button onClick={() => navigate('/student/login')} variant="primary">
            Sign in
          </Button>
        </div>
      </nav>

      {/* Hero - Centered */}
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* College Logo */}
          <div className="flex justify-center">
            <img 
              src="/logo.jpeg" 
              alt="SVPCET Logo" 
              className="w-32 h-32 rounded-lg shadow-lg" 
            />
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            <div>
              <h2 className="text-6xl md:text-7xl font-bold text-white mb-4 leading-tight">
                Your classroom,<br />reimagined.
              </h2>
              <p className="text-lg text-gray-300 max-w-xl mx-auto">
                A modern learning management system designed for students, teachers, and administrators. Connect, learn, and grow together.
              </p>
            </div>

            {/* Auth Buttons - Horizontal Row */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button
                onClick={() => navigate('/student/login')}
                variant="primary"
                size="lg"
                className="bg-[#7C5CFC] hover:bg-[#6644F4] text-white"
              >
                Join as Student
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => navigate('/teacher/login')}
                variant="ghost"
                size="lg"
                className="border-2 border-[#7C5CFC] text-[#7C5CFC] hover:bg-[#7C5CFC]/10"
              >
                Join as Teacher
              </Button>
              <Button
                onClick={() => navigate('/admin/login')}
                variant="ghost"
                size="lg"
                className="border-2 border-[#7C5CFC] text-[#7C5CFC] hover:bg-[#7C5CFC]/10"
              >
                Join as Admin
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto w-full px-6 py-8 text-center text-gray-400">
          <p>© 2024 SVPCET. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
