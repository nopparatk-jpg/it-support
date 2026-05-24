'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorAlert } from '@/components/ui/error-alert';
import { Spinner } from '@/components/ui/spinner';
import { DEVICE_STATUS_OPTIONS, DEVICE_STATUS_LABELS } from '@/lib/constants';

export default function NewDevicePage() {
  const router = useRouter();
  const [deviceTypes, setDeviceTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    type: '',
    brand: '',
    model: '',
    serialNumber: '',
    status: 'available',
    purchaseDate: '',
    purchasePrice: '',
    warrantyExpiry: '',
    supplier: '',
    assetTag: '',
    notes: '',
  });

  useEffect(() => {
    fetch('/api/settings/deviceTypes')
      .then((r) => r.json())
      .then((d) => setDeviceTypes(d.deviceTypes ?? []))
      .catch(() => {});
  }, []);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body = {
        ...form,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
        purchaseDate: form.purchaseDate || undefined,
        warrantyExpiry: form.warrantyExpiry || undefined,
      };

      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create device');
      }

      const data = await res.json();
      router.push(`/devices/${data.device?._id ?? data._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create device');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Add Device</h1>

      <Card>
        <CardHeader>
          <CardTitle>Device Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorAlert message={error} />}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Device Name</Label>
                <Input id="name" value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="e.g. MacBook Pro 14" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type">Type</Label>
                <Select id="type" value={form.type} onChange={(e) => updateField('type', e.target.value)} required>
                  <option value="">Select type</option>
                  {deviceTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" value={form.brand} onChange={(e) => updateField('brand', e.target.value)} required placeholder="e.g. Apple" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="model">Model</Label>
                <Input id="model" value={form.model} onChange={(e) => updateField('model', e.target.value)} required placeholder="e.g. MBP 14 M3" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input id="serialNumber" value={form.serialNumber} onChange={(e) => updateField('serialNumber', e.target.value)} required placeholder="e.g. C02X123456" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select id="status" value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                  {DEVICE_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{DEVICE_STATUS_LABELS[s]}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input id="purchaseDate" type="date" value={form.purchaseDate} onChange={(e) => updateField('purchaseDate', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="purchasePrice">Purchase Price (THB)</Label>
                <Input id="purchasePrice" type="number" value={form.purchasePrice} onChange={(e) => updateField('purchasePrice', e.target.value)} placeholder="0.00" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                <Input id="warrantyExpiry" type="date" value={form.warrantyExpiry} onChange={(e) => updateField('warrantyExpiry', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="supplier">Supplier</Label>
                <Input id="supplier" value={form.supplier} onChange={(e) => updateField('supplier', e.target.value)} placeholder="Supplier name" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assetTag">Asset Tag</Label>
              <Input id="assetTag" value={form.assetTag} onChange={(e) => updateField('assetTag', e.target.value)} placeholder="e.g. IT-001" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} rows={3} placeholder="Additional notes..." />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Spinner className="h-4 w-4" /> Creating...</> : 'Add Device'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
