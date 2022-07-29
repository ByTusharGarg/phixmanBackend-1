// Cron jobs At 12:00 Am

cron.schedule('0 0 0 * * *', () => {
    // code
}, {
    schedule: true,
    timezone: "Asia/Kolkata"
})