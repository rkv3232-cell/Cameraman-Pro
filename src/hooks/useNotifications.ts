import { useState, useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import toast from 'react-hot-toast';

export const useNotifications = () => {
    const [token, setToken] = useState<string | null>(null);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if (!('Notification' in window)) {
            console.log('This browser does not support desktop notification');
            return;
        }
        setPermission(Notification.permission);
    }, []);

    const requestPermission = async () => {
        try {
            if (!('Notification' in window)) return null;

            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm === 'granted') {
                const messaging = getMessaging();
                
                // Get registration token. Initially this makes a network call, once retrieved
                // subsequent calls to getToken will return from cache.
                const currentToken = await getToken(messaging, {
                    vapidKey: "BLX8xiBpFQrp8G8MRhAwWOYKI9Jc8JggkcOx4jQsFAClnsC0JGjYmMIhXbBF55ihN1Y0ptROWLWzFaHzOeKgLgQ"
                });

                if (currentToken) {
                    setToken(currentToken);
                    await saveTokenToFirestore(currentToken);
                    toast.success('✅ Notification enabled successfully');
                    return currentToken;
                } else {
                    console.log('No registration token available. Request permission to generate one.');
                }
            } else {
                console.log('Unable to get permission to notify.');
                toast.error('Notification permission denied');
            }
        } catch (error) {
            console.error('An error occurred while retrieving token. ', error);
        }
        return null;
    };

    const saveTokenToFirestore = async (fcmToken: string) => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const tokenRef = doc(collection(db, 'notificationTokens'), user.uid + '_' + fcmToken.substring(0, 10));
            await setDoc(tokenRef, {
                userId: user.uid,
                token: fcmToken,
                device: navigator.userAgent,
                createdAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error saving FCM token to Firestore:', error);
        }
    };

    // Listen for foreground messages
    useEffect(() => {
        try {
            if (permission === 'granted') {
                const messaging = getMessaging();
                const unsubscribe = onMessage(messaging, (payload) => {
                    console.log('Message received in foreground. ', payload);
                    if (payload.notification?.title) {
                        toast(payload.notification.title + '\n' + (payload.notification.body || ''), {
                            icon: '🔔',
                            duration: 5000,
                        });
                    }
                });
                return () => unsubscribe();
            }
        } catch (e) {
            console.log('Foreground messaging not initialized', e);
        }
    }, [permission]);

    return { token, permission, requestPermission };
};
