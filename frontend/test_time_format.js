// Test the time formatting logic
const time = 1721310420; // This should be around 15:07 UTC on 2025-07-18

console.log('Testing time formatting:');
console.log('Input timestamp:', time);

// Method 1: Direct UTC methods
const date = new Date(time * 1000);
const utcHours = date.getUTCHours();
const utcMinutes = date.getUTCMinutes();
const utcMonth = date.getUTCMonth();
const utcDay = date.getUTCDate();

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatted = `${monthNames[utcMonth]} ${utcDay}, ${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`;

console.log('Formatted time (UTC):', formatted);
console.log('UTC components:', { utcHours, utcMinutes, utcMonth, utcDay });

// Method 2: Using toLocaleString with UTC
const utcString = date.toISOString();
const utcDate = new Date(utcString);
const localeFormatted = utcDate.toLocaleString('en-US', { 
  month: 'short', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC'
});

console.log('Locale formatted (UTC):', localeFormatted);

// Method 3: Direct local time (for comparison)
const localFormatted = date.toLocaleString('en-US', { 
  month: 'short', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

console.log('Local time:', localFormatted); 