import { useEffect } from 'react';

export function useStructuredData(schemaData: object, id: string) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    let script = document.getElementById(id) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.text = JSON.stringify(schemaData);

    return () => {
      const existingScript = document.getElementById(id);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [schemaData, id]);
}
