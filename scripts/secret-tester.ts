import "load-env";

import { decryptValue, encryptValue } from "../src/lib/encryption.js";

// Test secret
const testSecret = "This is a test secret value.";

// Encrypt the test secret
const encrypted = encryptValue(testSecret);
console.log("Encrypted Value:", encrypted);

// Decrypt the test secret
const decrypted = decryptValue(encrypted);
console.log("Decrypted Value:", decrypted);
