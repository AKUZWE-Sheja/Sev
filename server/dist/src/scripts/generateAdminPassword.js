"use strict";
const bcrypt = require('bcrypt');
async function generatePassword() {
    const password = 'adminEdwige123';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed Password:', hashedPassword);
}
generatePassword();
// npx ts-node scripts/generatePassword.ts
