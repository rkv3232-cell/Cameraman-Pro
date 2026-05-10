import { useState, useEffect, useCallback } from 'react';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import toast from 'react-hot-toast';

// Extend window for OneSignal
declare global {
  interface Window {
    OneSignalDeferred: any[];
    OneSignal: any;
  }
}

export const useNotifications = () => {
    const [token, setToken] = useState<string | null>(null);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    // Read initial permission state from browser
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const saveTokenToFirestore = useCallback(async (subscriptionId: string) => {
        const user = auth.currentUser;
        if (!user) return;
        try {
            const tokenRef = doc(collection(db, 'notificationTokens'), user.uid + '_os');
            await setDoc(tokenRef, {
                userId: user.uid,
                token: subscriptionId,
                type: 'onesignal',
                device: navigator.userAgent,
                createdAt: serverTimestamp(),
            });
            // Link OneSignal user to Firebase UID
            if (window.OneSignal) {
                await window.OneSignal.login(user.uid);
            }
        } catch (error) {
            console.error('Error saving token:', error);
        }
    }, []);

    const requestPermission = useCallback(async () => {
        try {
            // Wait for OneSignal to be ready
            if (!window.OneSignal) {
                // Fallback: push to deferred queue
                window.OneSignalDeferred = window.OneSignalDeferred || [];
                window.OneSignalDeferred.push(async (OneSignal: any) => {
                    await OneSignal.Notifications.requestPermission();
                    if (OneSignal.Notifications.permission) {
                        const id = OneSignal.User.PushSubscription.id;
                        setPermission('granted');
                        setToken(id);
                        await saveTokenToFirestore(id);
                        toast.success('✅ Notifications enabled!');
                    }
                });
                return;
            }

            // OneSignal already loaded
            await window.OneSignal.Notifications.requestPermission();
            
            if (window.OneSignal.Notifications.permission) {
                const id = window.OneSignal.User.PushSubscription.id;
                setPermission('granted');
                setToken(id);
                if (id) await saveTokenToFirestore(id);
                toast.success('✅ Notifications enabled!');
            } else {
                setPermission('denied');
                toast.error('Notification permission denied');
            }
        } catch (error) {
            console.error('Notification Error:', error);
        }
    }, [saveTokenToFirestore]);

    return { token, permission, requestPermission };
};
