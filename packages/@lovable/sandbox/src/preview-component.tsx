import React, { useEffect, useRef, useState } from 'react';
import { SandboxManager } from './sandbox-manager.js';

interface PreviewComponentProps {
  files: Map<string, string>;
  onReady?: (previewUrl: string) => void;
  onError?: (error: Error) => void;
}

export const PreviewComponent: React.FC<PreviewComponentProps> = ({
  files,
  onReady,
  onError
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const managerRef = useRef<SandboxManager | null>(null);

  useEffect(() => {
    initializePreview();
    return () => {
      // Cleanup sandbox on unmount
      if (managerRef.current) {
        managerRef.current.destroySandbox('preview-sandbox');
      }
    };
  }, []);

  useEffect(() => {
    if (managerRef.current && previewUrl) {
      updatePreview();
    }
  }, [files]);

  const initializePreview = async () => {
    try {
      setIsLoading(true);
      setError('');

      const manager = new SandboxManager();
      managerRef.current = manager;

      const sandbox = await manager.createSandbox('preview-sandbox', files);
      
      setPreviewUrl(sandbox.previewUrl);
      onReady?.(sandbox.previewUrl);
      setIsLoading(false);

    } catch (err) {
      const error = err as Error;
      setError(error.message);
      onError?.(error);
      setIsLoading(false);
    }
  };

  const updatePreview = async () => {
    try {
      if (managerRef.current) {
        await managerRef.current.updateSandbox('preview-sandbox', files);
      }
    } catch (err) {
      console.error('Failed to update preview:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Starting WebContainer...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50">
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-sm text-red-600">Preview Error:</p>
          <p className="text-xs text-red-500">{error}</p>
          <button 
            onClick={initializePreview}
            className="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <iframe
        ref={iframeRef}
        src={previewUrl}
        className="w-full h-full border-0"
        allow="cross-origin-isolated"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 text-xs rounded">
        ✅ Live Preview
      </div>
    </div>
  );
};

export default PreviewComponent;