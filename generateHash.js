const bcrypt = require('bcryptjs');

// This script generates password hashes for use in the authentication system
// Run this script with Node.js to generate hashes for your passwords
// Example: node generateHash.js

// Set the password you want to hash here
const password = 'password'; // Change this to the password you want to hash
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    console.log('Password:', password);
    console.log('Hashed Password:', hash);
});