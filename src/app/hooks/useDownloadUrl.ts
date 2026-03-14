import { useEffect, useState } from 'react';

interface VersionMetadata {
  latestVersion: string;
  minimumSupportedVersion: string;
  downloadUrl: string;
  releaseNotes: string;
}

interface useDownloadUrlReturn {
  downloadUrl: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch the download URL from version.json hosted on GitHub Pages
 * Uses relative path (/version.json) for flexibility across environments
 */
export function useDownloadUrl(): useDownloadUrlReturn {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDownloadUrl = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use relative path for flexibility
        const response = await fetch('/version.json', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch version.json: ${response.status}`);
        }

        const data: VersionMetadata = await response.json();

        if (!data.downloadUrl) {
          throw new Error('downloadUrl not found in version.json');
        }

        if (isMounted) {
          setDownloadUrl(data.downloadUrl);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch download URL';
        console.error('useDownloadUrl error:', errorMessage);
        
        if (isMounted) {
          setError(errorMessage);
          // Fallback to GitHub releases page if version.json fails
          setDownloadUrl('https://github.com/JisooKristo/Photobooth-app/releases');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDownloadUrl();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  return { downloadUrl, loading, error };
}
