import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  const db = mongoose.connection.db!;

  console.log('Clearing existing data...');
  const collections = ['users', 'categories', 'settings', 'tickets', 'comments', 'devices', 'licenses', 'assignments', 'activities', 'notifications', 'counters'];
  for (const c of collections) {
    try { await db.collection(c).drop(); } catch { /* ok */ }
  }

  const hashedPassword = await bcrypt.hash('Admin@1234', 12);
  const agentPassword = await bcrypt.hash('Agent@1234', 12);
  const userPassword = await bcrypt.hash('User@1234', 12);

  console.log('Creating users...');
  const users = await db.collection('users').insertMany([
    {
      name: 'Admin User',
      email: 'admin@company.com',
      password: hashedPassword,
      role: 'admin',
      employeeId: 'EMP-000',
      department: 'IT',
      position: 'IT Manager',
      tel: '1000',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Sarah Chen',
      email: 'sarah@company.com',
      password: agentPassword,
      role: 'agent',
      employeeId: 'EMP-001',
      department: 'IT',
      position: 'IT Support',
      tel: '1001',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Mike Johnson',
      email: 'mike@company.com',
      password: userPassword,
      role: 'requester',
      employeeId: 'EMP-002',
      department: 'Marketing',
      position: 'Marketing Manager',
      tel: '2001',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Lisa Wang',
      email: 'lisa@company.com',
      password: userPassword,
      role: 'requester',
      employeeId: 'EMP-003',
      department: 'Engineering',
      position: 'Software Engineer',
      tel: '3001',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Tom Baker',
      email: 'tom@company.com',
      password: userPassword,
      role: 'requester',
      employeeId: 'EMP-004',
      department: 'Finance',
      position: 'Accountant',
      tel: '4001',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const userIds = Object.values(users.insertedIds);

  console.log('Creating categories...');
  await db.collection('categories').insertMany([
    { name: 'Hardware', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Software', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Network', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Account & Access', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Email', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Other', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]);

  console.log('Creating settings...');
  await db.collection('settings').insertMany([
    { key: 'deviceTypes', values: ['Laptop', 'Monitor', 'Phone', 'Printer', 'Keyboard', 'Mouse', 'Tablet'] },
    { key: 'departments', values: ['IT', 'Engineering', 'Marketing', 'Finance', 'HR', 'Operations', 'Sales'] },
  ]);

  console.log('Creating devices...');
  const devices = await db.collection('devices').insertMany([
    { name: 'MacBook Pro 16"', type: 'Laptop', brand: 'Apple', model: 'MacBook Pro 16 M3', serialNumber: 'C02G1234HKDT', status: 'assigned', purchaseDate: new Date('2025-06-15'), purchasePrice: 89900, warrantyExpiry: new Date('2027-06-15'), supplier: 'iStudio', assetTag: 'IT-LAP-001', notes: '', createdAt: new Date(), updatedAt: new Date() },
    { name: 'Dell U2723QE', type: 'Monitor', brand: 'Dell', model: 'U2723QE', serialNumber: 'DL4829371', status: 'available', purchaseDate: new Date('2025-03-10'), purchasePrice: 18500, warrantyExpiry: new Date('2028-03-10'), supplier: 'Dell Thailand', assetTag: 'IT-MON-001', notes: '', createdAt: new Date(), updatedAt: new Date() },
    { name: 'HP LaserJet Pro', type: 'Printer', brand: 'HP', model: 'LaserJet Pro MFP', serialNumber: 'HP2938471', status: 'maintenance', purchaseDate: new Date('2024-01-20'), purchasePrice: 12500, warrantyExpiry: new Date('2025-01-20'), supplier: 'HP Thailand', assetTag: 'IT-PRT-001', notes: 'Paper jam issue', createdAt: new Date(), updatedAt: new Date() },
    { name: 'ThinkPad X1 Carbon', type: 'Laptop', brand: 'Lenovo', model: 'ThinkPad X1 Carbon Gen 11', serialNumber: 'LNV9283741', status: 'available', purchaseDate: new Date('2025-08-01'), purchasePrice: 59900, warrantyExpiry: new Date('2028-08-01'), supplier: 'Lenovo Thailand', assetTag: 'IT-LAP-002', notes: '', createdAt: new Date(), updatedAt: new Date() },
    { name: 'iPhone 15 Pro', type: 'Phone', brand: 'Apple', model: 'iPhone 15 Pro', serialNumber: 'DNPXYZ12345', status: 'retired', purchaseDate: new Date('2023-10-01'), purchasePrice: 42900, warrantyExpiry: new Date('2024-10-01'), supplier: 'iStudio', assetTag: 'IT-PHN-001', notes: 'Battery degraded', createdAt: new Date(), updatedAt: new Date() },
  ]);

  const deviceIds = Object.values(devices.insertedIds);

  console.log('Creating assignments...');
  await db.collection('assignments').insertMany([
    { device: deviceIds[0], user: userIds[2], assignedBy: userIds[1], assignedDate: new Date('2025-07-01'), status: 'active', notes: 'New hire equipment', createdAt: new Date(), updatedAt: new Date() },
  ]);

  console.log('Creating licenses...');
  await db.collection('licenses').insertMany([
    { name: 'Microsoft 365 Business', licenseKey: 'MS365-XXXX-YYYY-ZZZZ', type: 'per-seat', vendor: 'Microsoft', totalSeats: 50, usedSeats: 42, purchaseDate: new Date('2025-01-01'), expiryDate: new Date('2026-12-31'), cost: 150000, status: 'active', notes: '', createdAt: new Date(), updatedAt: new Date() },
    { name: 'Adobe Creative Cloud', licenseKey: 'ADOBE-AAAA-BBBB-CCCC', type: 'per-seat', vendor: 'Adobe', totalSeats: 10, usedSeats: 8, purchaseDate: new Date('2025-06-01'), expiryDate: new Date('2026-06-01'), cost: 85000, status: 'active', notes: '', createdAt: new Date(), updatedAt: new Date() },
    { name: 'Slack Enterprise', licenseKey: 'SLACK-1111-2222-3333', type: 'site', vendor: 'Salesforce', totalSeats: 999, usedSeats: 45, purchaseDate: new Date('2025-03-01'), expiryDate: new Date('2027-03-01'), cost: 200000, status: 'active', notes: '', createdAt: new Date(), updatedAt: new Date() },
    { name: 'Figma Professional', licenseKey: 'FIG-XXXX-YYYY-ZZZZ', type: 'per-seat', vendor: 'Figma', totalSeats: 5, usedSeats: 5, purchaseDate: new Date('2024-01-01'), expiryDate: new Date('2026-01-01'), cost: 25000, status: 'expired', notes: '', createdAt: new Date(), updatedAt: new Date() },
  ]);

  console.log('Seed complete!');
  console.log('');
  console.log('Login credentials:');
  console.log('  Admin:     admin@company.com / Admin@1234');
  console.log('  Agent:     sarah@company.com / Agent@1234');
  console.log('  Requester: mike@company.com / User@1234');

  await mongoose.disconnect();
}

seed().catch(console.error);
