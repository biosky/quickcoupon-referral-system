import { useState, useEffect } from 'react';

/**
 * Custom hook to load external ad scripts dynamically
 * @param {string} src - Script source URL
 * @param {object} options - Configuration options
 */
export const useAdScript = (src, options = {}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Don't load if no src provided
    if (!src) {
      setLoading(false);
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      setLoading(false);
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.type = 'text/javascript';

    // Handle load success
    const onLoad = () => {
      setLoading(false);
      if (options.onLoad) {
        options.onLoad();
      }
    };

    // Handle load error
    const onError = (err) => {
      setLoading(false);
      setError(err);
      if (options.onError) {
        options.onError(err);
      }
    };

    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);

    // Append to document
    document.body.appendChild(script);

    // Cleanup function
    return () => {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [src, options]);

  return { loading, error };
};
