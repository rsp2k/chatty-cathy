// generate-vapid-keys.js - Run once to generate your VAPID keys
import webpush from 'web-push';
import fs from 'fs';

const vapidKeys = webpush.generateVAPIDKeys();

console.log('🔑 NEW VAPID Keys Generated (old ones were compromised):');
console.log('');
console.log('Public Key:');
console.log(vapidKeys.publicKey);
console.log('');
console.log('Private Key:');
console.log(vapidKeys.privateKey);
console.log('');
console.log('📝 Add these to your .env file:');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_EMAIL=mailto:your-email@example.com`);

// Create .env file
const envContent = `VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
VAPID_EMAIL=mailto:your-email@example.com`;

fs.writeFileSync('.env', envContent);

// Also save to a JSON file (gitignored)
fs.writeFileSync('vapid-keys.json', JSON.stringify(vapidKeys, null, 2));
console.log('');
console.log('✅ Keys saved to .env and vapid-keys.json');
console.log('🚨 Keep your private key secret!');
console.log('📝 .env file created - this will NOT be committed to git');