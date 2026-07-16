/**
 * Database Seeder
 *
 * Menambahkan data awal (seed users) ke database untuk testing.
 *
 * Cara pakai:
 *   node src/seed.js                    # seed semua data
 *   node src/seed.js --drop             # drop & reseed dari awal
 *   node src/seed.js --help             # daftar perintah
 *
 * Test Users yang dibuat:
 *   ┌─────────────────┬──────────────────────────┬──────────┬────────┐
 *   │ Name            │ Email                    │ Password │ Role   │
 *   ├─────────────────┼──────────────────────────┼──────────┼────────┤
 *   │ Admin User      │ admin@test.com           │ Admin123 │ admin  │
 *   │ John Doe        │ john@test.com            │ User1234 │ user   │
 *   │ Jane Smith      │ jane@test.com            │ User1234 │ user   │
 *   │ Bob Johnson     │ bob@test.com             │ User1234 │ user   │
 *   └─────────────────┴──────────────────────────┴──────────┴────────┘
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, testConnection, syncModels } = require('./config/database');
const User = require('./models/User');
const logger = require('./config/logger');

const SALT_ROUNDS = 12;

const seedUsers = [
  {
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'Admin123',
    role: 'admin',
    isActive: true
  },
  {
    name: 'John Doe',
    email: 'john@test.com',
    password: 'User1234',
    role: 'user',
    isActive: true
  },
  {
    name: 'Jane Smith',
    email: 'jane@test.com',
    password: 'User1234',
    role: 'user',
    isActive: true
  },
  {
    name: 'Bob Johnson',
    email: 'bob@test.com',
    password: 'User1234',
    role: 'user',
    isActive: true
  }
];

async function seed(dropFirst = false) {
  // Koneksi database
  const dbOk = await testConnection();
  if (!dbOk) {
    logger.error('Database tidak tersedia — jalankan MariaDB dulu');
    logger.info('  docker compose up -d mariadb');
    process.exit(1);
  }

  // Sync models (buat tabel jika belum ada)
  await syncModels();

  // Drop existing data jika flag --drop
  if (dropFirst) {
    logger.warn('Menghapus semua data user yang ada...');
    await User.destroy({ where: {}, truncate: true });
    logger.info('Semua data user dihapus');
  }

  // Hash password & insert
  logger.info(`Menambahkan ${seedUsers.length} user test...`);

  let inserted = 0;
  for (const userData of seedUsers) {
    const existing = await User.findOne({ where: { email: userData.email } });
    if (existing) {
      logger.info(`  ⏭  ${userData.email} — sudah ada, skip`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    await User.create({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
      isActive: userData.isActive
    });
    logger.info(`  ✅ ${userData.email} (${userData.role})`);
    inserted++;
  }

  logger.info(`\n✨ Seed selesai! ${inserted} user baru ditambahkan`);
  logger.info('\n📋 Test Credentials:');
  logger.info('   Admin : admin@test.com / Admin123');
  logger.info('   User  : john@test.com / User1234');
  logger.info('   User  : jane@test.com / User1234');
  logger.info('   User  : bob@test.com  / User1234');

  await sequelize.close();
}

// ── CLI Handler ──
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node src/seed.js [options]

Options:
  --drop     Hapus semua data user dulu, lalu seed ulang
  --help     Tampilkan pesan ini

Test Users:
  admin@test.com   / Admin123    (role: admin)
  john@test.com    / User1234    (role: user)
  jane@test.com    / User1234    (role: user)
  bob@test.com     / User1234    (role: user)
`);
  process.exit(0);
}

const dropFirst = args.includes('--drop');

seed(dropFirst).catch((err) => {
  logger.error('Seed gagal:', err);
  process.exit(1);
});
