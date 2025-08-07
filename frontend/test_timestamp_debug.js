// Test timestamp conversion
const testTimestamp = "2025-07-18T15:10:00";

console.log("Original timestamp:", testTimestamp);

// Simulate what the chart does
const date = new Date(testTimestamp);
console.log("Date object:", date);
console.log("Date toString():", date.toString());
console.log("Date toISOString():", date.toISOString());

// Get UTC components
const utcHours = date.getUTCHours();
const utcMinutes = date.getUTCMinutes();
const utcMonth = date.getUTCMonth();
const utcDay = date.getUTCDate();

console.log("UTC components:", {
  utcHours,
  utcMinutes,
  utcMonth,
  utcDay
});

// Get local components
const localHours = date.getHours();
const localMinutes = date.getMinutes();
const localMonth = date.getMonth();
const localDay = date.getDate();

console.log("Local components:", {
  localHours,
  localMinutes,
  localMonth,
  localDay
});

// Format as UTC time
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const utcFormatted = `${monthNames[utcMonth]} ${utcDay}, ${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`;
const localFormatted = `${monthNames[localMonth]} ${localDay}, ${localHours.toString().padStart(2, '0')}:${localMinutes.toString().padStart(2, '0')}`;

console.log("UTC formatted:", utcFormatted);
console.log("Local formatted:", localFormatted);

// Test with timestamp in seconds (like the chart receives)
const timestampInSeconds = date.getTime() / 1000;
console.log("Timestamp in seconds:", timestampInSeconds);

// Recreate date from seconds
const recreatedDate = new Date(timestampInSeconds * 1000);
console.log("Recreated date:", recreatedDate);
console.log("Recreated UTC hours:", recreatedDate.getUTCHours());
console.log("Recreated local hours:", recreatedDate.getHours()); 