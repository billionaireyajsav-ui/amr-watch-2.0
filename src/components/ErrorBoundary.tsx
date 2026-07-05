import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Primitives';

interface Props { children: ReactNode }
interface State { hasError: boolean; message?: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('AMR Watch encountered an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
          <AlertTriangle size={40} className="text-[var(--color-hazard)] mb-4" />
          <h1 className="font-display text-xl font-bold mb-2">Something went wrong</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-6 max-w-md">
            {this.state.message ?? 'An unexpected error occurred while rendering this page.'}
          </p>
          <Button onClick={() => window.location.reload()}>Reload the app</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
