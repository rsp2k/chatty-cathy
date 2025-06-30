// generate-vapid-keys.js - Run once to generate your VAPID keys
const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('📝 VAPID Keys Generated:');
console.log('');
console.log('Public Key (add this to your pwa.ts file):');
console.log(vapidKeys.publicKey);
console.log('');
console.log('Private Key (add this to your .env file):');
console.log(vapidKeys.privateKey);
console.log('');
console.log('Add these to your .env file:');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_EMAIL=mailto:your-email@example.com`);

// Also save to a JSON file
const fs = require('fs');
fs.writeFileSync('vapid-keys.json', JSON.stringify(vapidKeys, null, 2));
console.log('');
console.log('✅ Keys saved to vapid-keys.json');
console.log('🚨 Keep your private key secret!');
