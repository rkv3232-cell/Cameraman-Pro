const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const { format } = require("date-fns");

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

exports.sendBookingReminders = onSchedule({
    schedule: "0 * * * *", // Run at the top of every hour
    timeZone: "Asia/Kolkata",
}, async (event) => {
    try {
        console.log("Checking for bookings today...");
        
        const now = new Date();
        // Since it runs every hour, we get the current hour in HH:00 format (e.g., "07:00")
        const currentHourStr = format(now, "HH:00");
        
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        
        // Fetch all studio settings to see whose timings match currentHourStr
        const settingsSnapshot = await db.collection("studioSettings").get();
        const activeStudios = [];
        
        settingsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.remindersEnabled && data.timings && data.timings.includes(currentHourStr)) {
                activeStudios.push({ studioId: doc.id, ...data });
            }
        });

        if (activeStudios.length === 0) {
            console.log("No studios scheduled for this hour.");
            return;
        }

        const messages = [];

        for (const studio of activeStudios) {
            // Find bookings for this studio today
            const bookingsSnapshot = await db.collection("bookings")
                .where("studioId", "==", studio.studioId) // Assuming bookings have studioId
                .where("eventDate", ">=", startOfDay)
                .where("eventDate", "<=", endOfDay)
                .get();

            if (bookingsSnapshot.empty) continue;

            // Get tokens for this studio's admin/users
            // To simplify, we get tokens where userId matches the studioId, 
            // but in Cameraman Pro, tokens are saved with userId. We'll need to fetch users belonging to studioId.
            // For now, let's just fetch tokens where userId == studio.studioId (assuming owner ID is studio ID)
            const tokensSnapshot = await db.collection("notificationTokens")
                .where("userId", "==", studio.studioId)
                .get();
                
            if (tokensSnapshot.empty) continue;

            const tokens = [];
            tokensSnapshot.forEach(doc => tokens.push(doc.data().token));

            bookingsSnapshot.forEach((doc) => {
                const booking = doc.data();
                const clientName = booking.clientName || 'Client';
                const eventType = booking.eventType || 'Event';
                const location = booking.venue || 'Unknown Location';
                
                let eventTime = 'TBD';
                if (booking.eventDate && booking.eventDate.toDate) {
                     eventTime = format(booking.eventDate.toDate(), "hh:mm a");
                } else if (booking.time) {
                     eventTime = booking.time;
                }

                // Custom message parsing
                let customBody = studio.customMessage || "Aaj {clientName} ki {eventType} Booking hai.\n\n📍 Location: {location}\n🕒 Event Time: {eventTime}\n\nPlease prepare camera and equipment.";
                customBody = customBody.replace(/{clientName}/g, clientName)
                                       .replace(/{eventType}/g, eventType)
                                       .replace(/{location}/g, location)
                                       .replace(/{eventTime}/g, eventTime);

                messages.push({
                    notification: {
                        title: "📸 Cameraman Pro Reminder",
                        body: customBody,
                    },
                    tokens: tokens,
                    android: { priority: "high" },
                    apns: { payload: { aps: { contentAvailable: true, sound: "default" } } }
                });
            });
        }

        console.log(`Sending ${messages.length} multicast messages...`);
        for (const msg of messages) {
            if (msg.tokens && msg.tokens.length > 0) {
                const response = await messaging.sendEachForMulticast(msg);
                console.log(`Successfully sent message: ${response.successCount} successes, ${response.failureCount} failures.`);
            }
        }

    } catch (error) {
        console.error("Error in scheduled booking reminders:", error);
    }
});
