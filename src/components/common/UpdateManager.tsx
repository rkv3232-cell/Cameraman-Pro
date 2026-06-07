import { useEffect } from 'react';

export const UpdateManager = () => {
    useEffect(() => {
        const checkForUpdates = async () => {
            try {
                // Check version.json with a cache-busting timestamp
                const response = await fetch(`/version.json?t=${Date.now()}`, {
                    cache: 'no-store'
                });
                const data = await response.json();
                const latestVersion = data.version;
                const currentVersion = localStorage.getItem('app_version');

                if (currentVersion && currentVersion !== latestVersion) {
                    console.log('New version detected! Reloading...', { current: currentVersion, latest: latestVersion });
                    localStorage.setItem('app_version', latestVersion);
                    
                    // Clear service worker caches and reload
                    if ('serviceWorker' in navigator) {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        for (const registration of registrations) {
                            await registration.update();
                        }
                    }
                    
                    window.location.reload();
                } else if (!currentVersion) {
                    localStorage.setItem('app_version', latestVersion);
                }
            } catch (err) {
                console.error('Failed to check for updates:', err);
            }
        };

        // Check on mount and then every 30 minutes
        checkForUpdates();
        const interval = setInterval(checkForUpdates, 30 * 60 * 1000);
        
        return () => clearInterval(interval);
    }, []);

    return null;
};
