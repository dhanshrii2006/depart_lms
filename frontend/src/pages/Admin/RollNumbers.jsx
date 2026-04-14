import { useState, useEffect } from 'react';
import { Card, Button, Loading } from '../../components/ui.jsx';
import { adminAPI } from '../../api/client.js';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

export default function AdminRollNumbers() {
  const [rollNumbers, setRollNumbers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchRollNumbers();
  }, []);

  const fetchRollNumbers = async () => {
    try {
      const response = await adminAPI.getValidRollNumbers();
      setRollNumbers(response.data);
    } catch (error) {
      toast.error('Failed to load roll numbers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await adminAPI.uploadRollNumbers(file);
      toast.success(`Added ${response.data.count} new roll numbers`);
      fetchRollNumbers();
      event.target.value = '';
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload roll numbers');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return <Loading />;

  const usedCount = rollNumbers.filter(r => r.is_used).length;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Roll Number Management</h1>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card>
          <p className="text-gray-600 mb-2">Total Roll Numbers</p>
          <p className="text-3xl font-bold text-gray-900">{rollNumbers.length}</p>
        </Card>
        <Card>
          <p className="text-gray-600 mb-2">Used</p>
          <p className="text-3xl font-bold text-green-600">{usedCount}</p>
        </Card>
        <Card>
          <p className="text-gray-600 mb-2">Available</p>
          <p className="text-3xl font-bold text-indigo-600">{rollNumbers.length - usedCount}</p>
        </Card>
      </div>

      <Card className="mb-8">
        <h3 className="text-lg font-bold mb-4">Upload Roll Numbers</h3>
        <p className="text-gray-600 mb-4 text-sm">
          Upload a CSV or TXT file with one roll number per line
        </p>
        <div className="flex gap-3">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <Button
            as="label"
            htmlFor="file-upload"
            variant="primary"
            className="flex items-center gap-2 cursor-pointer"
            disabled={isUploading}
          >
            <Upload className="w-5 h-5" />
            {isUploading ? 'Uploading...' : 'Choose File'}
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold mb-4">All Roll Numbers</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
          {rollNumbers.map((roll) => (
            <div
              key={roll.roll_number}
              className={`p-3 rounded-lg text-center text-sm font-semibold ${
                roll.is_used
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {roll.roll_number}
              {roll.is_used && ' ✓'}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
