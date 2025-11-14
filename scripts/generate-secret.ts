import crypto from "crypto";

// Generate a secure random secret
const secret = crypto.randomBytes(32).toString("base64");

console.log("Add this to your .env file:");
console.log(`ENCRYPTION_SECRET="${secret}"`);
