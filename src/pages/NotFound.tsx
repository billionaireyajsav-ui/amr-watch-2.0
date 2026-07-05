import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { Button } from '@/components/ui/Primitives';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <Activity size={40} className="text-[var(--color-culture)] mb-4" />
      <h1 className="font-display text-3xl font-bold mb-2">404</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">This page doesn't exist, or you don't have access to it.</p>
      <Link to="/dashboard"><Button>Back to dashboard</Button></Link>
    </div>
  );
}
