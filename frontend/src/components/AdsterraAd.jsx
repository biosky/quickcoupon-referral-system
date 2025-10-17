import { useEffect, useRef } from 'react';
import { useAdScript } from '../hooks/useAdScript';

/**
 * Adsterra Ad Component
 * Renders Adsterra ads based on provided configuration
 */
const AdsterraAd = ({ 
  atOptions,
  scriptSrc,
  containerId,
  className = '',
  style = {}
}) => {
  const containerRef = useRef(null);
  const { loading, error } = useAdScript(scriptSrc);

  useEffect(() => {
    // Inject ad configuration if provided
    if (atOptions && containerRef.current && !loading) {
      const configScript = document.createElement('script');
      configScript.type = 'text/javascript';
      configScript.innerHTML = `
        atOptions = ${JSON.stringify(atOptions)};
      `;
      containerRef.current.appendChild(configScript);
    }
  }, [atOptions, loading]);

  if (error) {
    console.error('Ad loading error:', error);
    return null; // Fail silently
  }

  return (
    <div 
      ref={containerRef}
      id={containerId}
      className={`adsterra-ad ${className}`}
      style={{
        minHeight: loading ? '90px' : 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      {loading && (
        <div className="text-sm text-gray-400">Loading...</div>
      )}
    </div>
  );
};

export default AdsterraAd;
