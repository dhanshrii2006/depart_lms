import { Card } from '../../components/ui.jsx';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui.jsx';

export default function StudentCourse() {
  const navigate = useNavigate();
  return (
    <div>
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2">
        <ArrowLeft /> Back
      </Button>
      <Card className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Course Page</h1>
        <p className="text-gray-600">Coming soon: Stream, Classwork, People tabs</p>
      </Card>
    </div>
  );
}
