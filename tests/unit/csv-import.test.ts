import { describe, it, expect } from 'vitest';

// Extract the CSV parsing logic that all import routes share
function parseCSV(csv: string): { dataLines: string[]; error?: string } {
  const lines = csv.split('\n').filter((line: string) => line.trim());
  if (lines.length < 2) {
    return { dataLines: [], error: 'CSV must have a header row and at least one data row' };
  }
  return { dataLines: lines.slice(1) };
}

function parseDeviceRow(line: string, rowNum: number) {
  const cols = line.split(',').map((c: string) => c.trim());
  const [name, type, brand, model, serialNumber, status] = cols;
  return { row: rowNum, name, type, brand, model, serialNumber, status };
}

function parseLicenseRow(line: string, rowNum: number) {
  const cols = line.split(',').map((c: string) => c.trim());
  const [name, licenseKey, type, vendor, totalSeats, expiryDate, cost, status] = cols;
  return { row: rowNum, name, licenseKey, type, vendor, totalSeats, expiryDate, cost, status };
}

function parseUserRow(line: string, rowNum: number) {
  const cols = line.split(',').map((c: string) => c.trim());
  const [name, email, role, employeeId, department, position, tel] = cols;
  return { row: rowNum, name, email: email?.toLowerCase(), role, employeeId, department, position, tel };
}

describe('CSV parsing', () => {
  describe('parseCSV', () => {
    it('rejects empty CSV', () => {
      const result = parseCSV('');
      expect(result.error).toBeTruthy();
    });

    it('rejects header-only CSV', () => {
      const result = parseCSV('name,type,brand');
      expect(result.error).toBeTruthy();
    });

    it('parses valid CSV', () => {
      const csv = 'name,type,brand\nMacBook,Laptop,Apple';
      const result = parseCSV(csv);
      expect(result.error).toBeUndefined();
      expect(result.dataLines).toHaveLength(1);
      expect(result.dataLines[0]).toBe('MacBook,Laptop,Apple');
    });

    it('skips empty lines', () => {
      const csv = 'header\nrow1\n\nrow2\n  \nrow3';
      const result = parseCSV(csv);
      expect(result.dataLines).toHaveLength(3);
    });
  });

  describe('parseDeviceRow', () => {
    it('parses all fields', () => {
      const row = parseDeviceRow('MacBook Pro,Laptop,Apple,MBP 14,SN123,available', 2);
      expect(row.name).toBe('MacBook Pro');
      expect(row.type).toBe('Laptop');
      expect(row.brand).toBe('Apple');
      expect(row.model).toBe('MBP 14');
      expect(row.serialNumber).toBe('SN123');
      expect(row.status).toBe('available');
    });

    it('trims whitespace', () => {
      const row = parseDeviceRow(' MacBook , Laptop , Apple , M3 , SN1 , assigned ', 2);
      expect(row.name).toBe('MacBook');
      expect(row.status).toBe('assigned');
    });

    it('handles missing optional fields', () => {
      const row = parseDeviceRow(',Laptop,Apple,Model,SN123,', 2);
      expect(row.name).toBe('');
      expect(row.status).toBe('');
    });
  });

  describe('parseLicenseRow', () => {
    it('parses all fields', () => {
      const row = parseLicenseRow('MS365,KEY-123,per-seat,Microsoft,50,2027-12-31,150000,active', 2);
      expect(row.name).toBe('MS365');
      expect(row.licenseKey).toBe('KEY-123');
      expect(row.type).toBe('per-seat');
      expect(row.vendor).toBe('Microsoft');
      expect(row.totalSeats).toBe('50');
      expect(row.expiryDate).toBe('2027-12-31');
      expect(row.cost).toBe('150000');
      expect(row.status).toBe('active');
    });
  });

  describe('parseUserRow', () => {
    it('parses and lowercases email', () => {
      const row = parseUserRow('John Doe,JOHN@Company.com,admin,EMP-001,IT,Manager,1234', 2);
      expect(row.name).toBe('John Doe');
      expect(row.email).toBe('john@company.com');
      expect(row.role).toBe('admin');
      expect(row.employeeId).toBe('EMP-001');
      expect(row.department).toBe('IT');
      expect(row.position).toBe('Manager');
      expect(row.tel).toBe('1234');
    });
  });
});

describe('import deduplication logic', () => {
  it('detects duplicates within a batch', () => {
    const existingSerials = new Set(['SN-001']);
    const rows = [
      { serialNumber: 'SN-001' }, // exists in DB
      { serialNumber: 'SN-002' }, // new
      { serialNumber: 'SN-002' }, // duplicate in batch
      { serialNumber: 'SN-003' }, // new
    ];

    const toCreate: string[] = [];
    const skipped: string[] = [];

    for (const r of rows) {
      if (existingSerials.has(r.serialNumber)) {
        skipped.push(r.serialNumber);
        continue;
      }
      existingSerials.add(r.serialNumber);
      toCreate.push(r.serialNumber);
    }

    expect(toCreate).toEqual(['SN-002', 'SN-003']);
    expect(skipped).toEqual(['SN-001', 'SN-002']);
  });
});
