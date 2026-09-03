import test from 'node:test';
import assert from 'node:assert/strict';
import { db, COLLECTIONS, DBUser, initDefaultUsers } from '../src/lib/db';

test('initDefaultUsers seeds admin and analyst accounts properly', () => {
  initDefaultUsers();

  const admin = db.findOne<DBUser>(COLLECTIONS.USERS, u => u.email.toLowerCase() === 'admin@bob.com');
  assert.ok(admin, 'Admin user must exist');
  assert.equal(admin.role, 'ADMIN');
  assert.equal(admin.status, 'APPROVED');
  assert.equal(admin.password, 'admin123');

  const analyst = db.findOne<DBUser>(COLLECTIONS.USERS, u => u.email.toLowerCase() === 'balwindersinghsardar1@gmail.com');
  assert.ok(analyst, 'Analyst user must exist');
  assert.equal(analyst.role, 'ANALYST');
  assert.equal(analyst.status, 'APPROVED');
  assert.equal(analyst.password, '123123');
});

test('New user registration flow defaults to PENDING status', () => {
  const testEmail = `testuser_${Date.now()}@example.com`;
  
  const newUser = db.create<DBUser>(COLLECTIONS.USERS, {
    name: 'Test Candidate',
    email: testEmail,
    password: 'password123',
    role: 'USER',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  });

  assert.ok(newUser.id);
  assert.equal(newUser.status, 'PENDING');

  // Admin approves user
  const updated = db.update<DBUser>(COLLECTIONS.USERS, newUser.id, {
    status: 'APPROVED',
    role: 'ANALYST',
  });

  assert.ok(updated);
  assert.equal(updated.status, 'APPROVED');
  assert.equal(updated.role, 'ANALYST');

  // Clean up
  db.delete(COLLECTIONS.USERS, newUser.id);
  const deleted = db.findById<DBUser>(COLLECTIONS.USERS, newUser.id);
  assert.equal(deleted, null);
});
