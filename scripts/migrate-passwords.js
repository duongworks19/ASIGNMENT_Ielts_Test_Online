const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const databasePath = path.resolve(__dirname, '..', 'database.json');
const data = JSON.parse(fs.readFileSync(databasePath, 'utf8'));
let migrated = 0;

data.users = (data.users || []).map((user) => {
  const nextUser = { ...user, email: String(user.email || '').trim().toLowerCase() };
  if (!nextUser.passwordHash && nextUser.password !== undefined) {
    nextUser.passwordHash = bcrypt.hashSync(String(nextUser.password), 10);
    migrated += 1;
  }
  delete nextUser.password;
  return nextUser;
});

data.passwordResetTokens = data.passwordResetTokens || [];
fs.writeFileSync(databasePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log(`Password migration complete. Migrated ${migrated} account(s).`);
