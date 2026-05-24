'use client';

import { useEffect, useState, use } from 'react';
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

export default function EditDevicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [deviceTypes, setDeviceTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    Promise.all([
      fetch(`/api/devices/${id}`).then((r) => r.json()),
      fetch('/api/settings/deviceTypes').then((r) => r.json()),
    ])
      .then(([deviceData, typesData]) => {
        const d = deviceData.device ?? deviceData;
        setForm({
          name: d.name || '',
          type: d.type || '',
          brand: d.brand || '',
          model: d.model || '',
          serialNumber: d.serialNumber || '',
          status: d.status || 'available',
          purchaseDate: d.purchaseDate ? d.purchaseDate.split('T')[0] : '',
          purchasePrice: d.purchasePrice ? String(d.purchasePrice) : '',
          warrantyExpiry: d.warrantyExpiry ? d.warrantyExpiry.split('T')[0] : '',
          supplier: d.supplier || '',
          assetTag: d.assetTag || '',
          notes: d.notes || '',
        });
        setDeviceTypes(typesData.deviceTypes ?? []);
      })
      .catch(() => setError('Failed to load device'))
      .finally(() => setLoading(false));
  }, [id]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const body = {
        ...form,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
        purchaseDate: form.purchaseDate || undefined,
        warrantyExpiry: form.warrantyExpiry || undefined,
      };

      const res = await fetch(`/api/devices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update device');
      }

      router.push(`/devices/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update device');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Edit Device</h1>

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
                <Input id="name" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
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
                <Input id="brand" value={form.brand} onChange={(e) => updateField('brand', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="model">Model</Label>
                <Input id="model" value={form.model} onChange={(e) => updateField('model', e.target.value)} required />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input id="serialNumber" value={form.serialNumber} onChange={(e) => updateField('serialNumber', e.target.value)} required />
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
                <Input id="purchasePrice" type="number" value={form.purchasePrice} onChange={(e) => updateField('purchasePrice', e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                <Input id="warrantyExpiry" type="date" value={form.warrantyExpiry} onChange={(e) => updateField('warrantyExpiry', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="supplier">Supplier</Label>
                <Input id="supplier" value={form.supplier} onChange={(e) => updateField('supplier', e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assetTag">Asset Tag</Label>
              <Input id="assetTag" value={form.assetTag} onChange={(e) => updateField('assetTag', e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} rows={3} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Spinner className="h-4 w-4" /> Saving...</> : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
