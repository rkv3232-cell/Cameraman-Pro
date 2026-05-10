import { useState, useEffect } from 'react';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import toast from 'react-hot-toast';

// Extend window for OneSignal
declare global {
  interface Window {
    OneSignalDeferred: any[];
  }
}

export const useNotifications = () => {
    const [token, setToken] = useState<string | null>(null);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            window.OneSignalDeferred.push(async (OneSignal: any) => {
                const perm = await OneSignal.Notifications.permission ? 'granted' : 'default';
                setPermission(perm as NotificationPermission);
            });
        }
    }, []);

    const requestPermission = async () => {
        return new Promise<string | null>((resolve) => {
            window.OneSignalDeferred.push(async (OneSignal: any) => {
                try {
                    console.log("Requesting OneSignal Permission...");
                    await OneSignal.Notifications.requestPermission();
                    
                    const isPushEnabled = OneSignal.Notifications.permission;
                    
                    if (isPushEnabled) {
                        const subscriptionId = OneSignal.User.PushSubscription.id;
                        if (subscriptionId) {
                            setToken(subscriptionId);
                            setPermission('granted');
                            await saveTokenToFirestore(subscriptionId);
                            toast.success('✅ Notifications enabled via OneSignal');
                            resolve(subscriptionId);
                        } else {
                            console.warn("OneSignal initialized but no subscription ID yet.");
                            resolve(null);
                        }
                    } else {
                        toast.error('Notification permission denied');
                        resolve(null);
                    }
                } catch (error) {
                    console.error('OneSignal Error:', error);
                    toast.error('Notification setup failed');
                    resolve(null);
                }
            });
        });
    };

    const saveTokenToFirestore = async (subscriptionId: string) => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            // Store OneSignal Subscription ID in the same collection
            // We use a prefix to distinguish from old FCM tokens
            const tokenRef = doc(collection(db, 'notificationTokens'), user.uid + '_os_' + subscriptionId.substring(0, 8));
            await setDoc(tokenRef, {
                userId: user.uid,
                token: subscriptionId,
                type: 'onesignal',
                device: navigator.userAgent,
                createdAt: serverTimestamp(),
            });

            // Associate the OneSignal user with our Firebase UID
            window.OneSignalDeferred.push(async (OneSignal: any) => {
                await OneSignal.login(user.uid);
                console.log("OneSignal User Linked:", user.uid);
            });

        } catch (error) {
            console.error('Error saving OneSignal token to Firestore:', error);
        }
    };

    return { token, permission, requestPermission };
};
