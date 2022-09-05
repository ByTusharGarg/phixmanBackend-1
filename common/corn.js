// Cron job every hour

cron.schedule('* * 59 * * *', () => {
    // code
    
}, {
    schedule: true,
    timezone: "Asia/Kolkata"
})