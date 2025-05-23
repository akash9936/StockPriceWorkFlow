function isInTradingHours() {
    const now = new Date();
    const day = now.getDay();
    
    // Check if it's a weekday (1-5, Monday to Friday)
    if (day === 0 || day === 6) {
        return false;
    }
    
    // Convert to IST (UTC+5:30)
    const istHour = now.getUTCHours() + 5;
    const istMinute = now.getUTCMinutes() + 30;
    
    // Adjust for minutes overflow
    const adjustedHour = istHour + Math.floor(istMinute / 60);
    const adjustedMinute = istMinute % 60;
    
    // Market hours: 9:15 AM to 3:30 PM IST
    const marketStartHour = 9;
    const marketStartMinute = 15;
    const marketEndHour = 15;
    const marketEndMinute = 30;
    
    // Check if current time is within market hours
    if (adjustedHour < marketStartHour || 
        (adjustedHour === marketStartHour && adjustedMinute < marketStartMinute) ||
        adjustedHour > marketEndHour ||
        (adjustedHour === marketEndHour && adjustedMinute > marketEndMinute)) {
        return false;
    }
    
    return true;
}

module.exports = { isInTradingHours }; 