'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Settings, Save, Hospital, Bell, Shield, Sliders, Webhook } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const list = d.data || [];
          setSettings(list);
          const map: Record<string, string> = {};
          list.forEach((s: any) => {
            map[s.key] = s.value;
          });
          setFormData(map);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, val: string) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = Object.entries(formData).map(([key, value]) => ({ key, value }));
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'บันทึกการตั้งค่าเรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({ icon: 'error', title: 'ไม่สามารถบันทึกได้', text: data.error?.message });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาดระบบ' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-sky-600" />
            <span>ตั้งค่าระบบและอัตลักษณ์โรงพยาบาล (System Settings)</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            กำหนดค่าคงที่ขององค์กร เกณฑ์การแจ้งเตือนโควต้า และการเชื่อมโยงระบบภายนอก
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Hospital Branding */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Hospital className="w-4 h-4 text-sky-600" />
            <span>1. ข้อมูลอัตลักษณ์โรงพยาบาล (Hospital Profile)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ชื่อโรงพยาบาล (ภาษาไทย)</label>
              <input
                type="text"
                value={formData['HOSPITAL_NAME_TH'] || ''}
                onChange={(e) => handleChange('HOSPITAL_NAME_TH', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">ชื่อโรงพยาบาล (English)</label>
              <input
                type="text"
                value={formData['HOSPITAL_NAME_EN'] || ''}
                onChange={(e) => handleChange('HOSPITAL_NAME_EN', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">ที่อยู่ทางการ</label>
              <input
                type="text"
                value={formData['HOSPITAL_ADDRESS'] || ''}
                onChange={(e) => handleChange('HOSPITAL_ADDRESS', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์ส่วนกลาง</label>
              <input
                type="text"
                value={formData['HOSPITAL_PHONE'] || ''}
                onChange={(e) => handleChange('HOSPITAL_PHONE', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">ปีงบประมาณปัจจุบัน (พ.ศ.)</label>
              <input
                type="text"
                value={formData['CURRENT_FISCAL_YEAR'] || '2569'}
                onChange={(e) => handleChange('CURRENT_FISCAL_YEAR', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Quota & Security Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-sky-600" />
            <span>2. เกณฑ์การแจ้งเตือนและการจัดการโควต้า</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                เปอร์เซ็นต์แจ้งเตือนโควต้าใกล้เต็ม (% คงเหลือ)
              </label>
              <input
                type="number"
                value={formData['QUOTA_WARNING_PERCENT'] || '30'}
                onChange={(e) => handleChange('QUOTA_WARNING_PERCENT', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                หากที่นั่งเหลือน้อยกว่าหรือเท่ากับค่านี้ สถานะจะเปลี่ยนเป็น LIMITED
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ขนาดไฟล์อัปโหลดสูงสุด (MB)
              </label>
              <input
                type="number"
                value={formData['MAX_UPLOAD_SIZE_MB'] || '15'}
                onChange={(e) => handleChange('MAX_UPLOAD_SIZE_MB', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                จำกัดเฉพาะ PDF, JPG, PNG ตามมาตรฐานความปลอดภัย
              </p>
            </div>
          </div>
        </div>

        {/* Training Coordinator Contacts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Bell className="w-4 h-4 text-sky-600" />
            <span>3. ข้อมูลผู้รับผิดชอบงานประสานแหล่งฝึกส่วนกลาง</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ชื่อผู้รับผิดชอบหลัก</label>
              <input
                type="text"
                value={formData['TRAINING_COORDINATOR_NAME'] || ''}
                onChange={(e) => handleChange('TRAINING_COORDINATOR_NAME', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">อีเมลงานฝึกอบรม</label>
              <input
                type="email"
                value={formData['TRAINING_COORDINATOR_EMAIL'] || ''}
                onChange={(e) => handleChange('TRAINING_COORDINATOR_EMAIL', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
