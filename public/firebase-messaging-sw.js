importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyD1I_UuatLVl8voku0M-E6TRr-GQeQhKZ0",
    authDomain: "cameraman-pro-2aa2b.firebaseapp.com",
    databaseURL: "https://cameraman-pro-2aa2b-default-rtdb.firebaseio.com",
    projectId: "cameraman-pro-2aa2b",
    storageBucket: "cameraman-pro-2aa2b.appspot.com",
    messagingSenderId: "35359737634",
    appId: "1:35359737634:web:e280b0e951ef77e295877b",
    measurementId: "G-KH2WE53E3L"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification?.title || 'Cameraman Pro';
    const notificationOptions = {
        body: payload.notification?.body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
