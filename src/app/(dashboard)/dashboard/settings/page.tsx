'use client';

import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import {
  Settings,
  Save,
  Hospital,
  Bell,
  Sliders,
  PenTool,
  Upload,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Image as ImageIcon,
  Sparkles,
  Info,
  ShieldCheck,
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({
    HOSPITAL_DIRECTOR_NAME: 'นายแพทย์ผู้อำนวยการโรงพยาบาลปลวกแดง',
    HOSPITAL_DIRECTOR_POSITION: 'ผู้อำนวยการโรงพยาบาลปลวกแดง',
    HOSPITAL_DIRECTOR_SIGNATURE_URL: '/signatures/director_signature.svg',
    HOSPITAL_DIRECTOR_SHOW_SIGNATURE: 'true',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      const d = await res.json();
      if (d.success) {
        const list = d.data || [];
        setSettings(list);
        const map: Record<string, string> = {
          HOSPITAL_DIRECTOR_NAME: 'นายแพทย์ผู้อำนวยการโรงพยาบาลปลวกแดง',
          HOSPITAL_DIRECTOR_POSITION: 'ผู้อำนวยการโรงพยาบาลปลวกแดง',
          HOSPITAL_DIRECTOR_SIGNATURE_URL: '/signatures/director_signature.svg',
          HOSPITAL_DIRECTOR_SHOW_SIGNATURE: 'true',
        };
        list.forEach((s: any) => {
          map[s.key] = s.value;
        });
        setFormData(map);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, val: string) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  // Handle uploading director signature image file
  const handleSignatureFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB for signature image)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'warning',
        title: 'ไฟล์มีขนาดใหญ่เกินไป',
        text: 'กรุณาเลือกไฟล์ภาพลายเซ็นต์ขนาดไม่เกิน 5 MB',
      });
      return;
    }

    try {
      setUploadingSig(true);
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('directorName', formData['HOSPITAL_DIRECTOR_NAME'] || '');
      uploadData.append('directorPosition', formData['HOSPITAL_DIRECTOR_POSITION'] || '');
      uploadData.append('showSignature', formData['HOSPITAL_DIRECTOR_SHOW_SIGNATURE'] || 'true');

      const res = await fetch('/api/settings/signature', {
        method: 'POST',
        body: uploadData,
      });

      const resData = await res.json();
      if (resData.success) {
        const newUrl = resData.data?.signatureUrl;
        setFormData((prev) => ({
          ...prev,
          HOSPITAL_DIRECTOR_SIGNATURE_URL: newUrl,
        }));
        Swal.fire({
          icon: 'success',
          title: 'อัปโหลดภาพลายเซ็นต์สำเร็จ',
          text: 'บันทึกลายเซ็นต์ผู้อำนวยการโรงพยาบาลเรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'อัปโหลดไม่สำเร็จ',
          text: resData.error?.message || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์',
        });
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาดระบบ' });
    } finally {
      setUploadingSig(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Quick select default SVG signature
  const handleSelectDefaultSignature = async () => {
    try {
      const defaultUrl = '/signatures/director_signature.svg';
      setFormData((prev) => ({
        ...prev,
        HOSPITAL_DIRECTOR_SIGNATURE_URL: defaultUrl,
      }));

      await fetch('/api/settings/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureUrl: defaultUrl,
          directorName: formData['HOSPITAL_DIRECTOR_NAME'],
          directorPosition: formData['HOSPITAL_DIRECTOR_POSITION'],
          showSignature: formData['HOSPITAL_DIRECTOR_SHOW_SIGNATURE'] === 'true',
        }),
      });

      Swal.fire({
        icon: 'success',
        title: 'เลือกใช้ลายเซ็นต์มาตรฐานแล้ว',
        text: 'ลายเซ็นต์เวกเตอร์มาตรฐาน (SVG) ถูกนำมาใช้งานเรียบร้อย',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาดระบบ' });
    }
  };

  // Quick select sample signature
  const handleSelectSampleSignature = async () => {
    try {
      const sampleUrl = '/signatures/sample_director_signature.jpg';
      setFormData((prev) => ({
        ...prev,
        HOSPITAL_DIRECTOR_SIGNATURE_URL: sampleUrl,
      }));

      await fetch('/api/settings/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureUrl: sampleUrl,
          directorName: formData['HOSPITAL_DIRECTOR_NAME'],
          directorPosition: formData['HOSPITAL_DIRECTOR_POSITION'],
          showSignature: formData['HOSPITAL_DIRECTOR_SHOW_SIGNATURE'] === 'true',
        }),
      });

      Swal.fire({
        icon: 'success',
        title: 'เลือกใช้ลายเซ็นต์ตัวอย่างแล้ว',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาดระบบ' });
    }
  };

  // Clear signature
  const handleClearSignature = async () => {
    const confirm = await Swal.fire({
      title: 'ยืนยันการลบลายเซ็นต์?',
      text: 'เอกสารและใบประกาศจะแสดงข้อความ "(ลงนามผู้อำนวยการ)" แทนภาพลายเซ็นต์',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ลบลายเซ็นต์',
      cancelButtonText: 'ยกเลิก',
    });

    if (!confirm.isConfirmed) return;

    try {
      setFormData((prev) => ({
        ...prev,
        HOSPITAL_DIRECTOR_SIGNATURE_URL: '',
      }));

      await fetch('/api/settings/signature', {
        method: 'DELETE',
      });

      Swal.fire({
        icon: 'success',
        title: 'ลบภาพลายเซ็นต์แล้ว',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาดระบบ' });
    }
  };

  // Handle Save All Settings
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
          title: 'บันทึกการตั้งค่าทั้งหมดเรียบร้อยแล้ว',
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

  const currentSigUrl = formData['HOSPITAL_DIRECTOR_SIGNATURE_URL'];
  const showSigEnabled = formData['HOSPITAL_DIRECTOR_SHOW_SIGNATURE'] !== 'false';

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
            กำหนดค่าคงที่ขององค์กร ลายเซ็นต์ผู้อำนวยการโรงพยาบาล เกณฑ์การแจ้งเตือน และการเชื่อมโยงระบบ
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
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">ชื่อโรงพยาบาล (English)</label>
              <input
                type="text"
                value={formData['HOSPITAL_NAME_EN'] || ''}
                onChange={(e) => handleChange('HOSPITAL_NAME_EN', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">ที่อยู่ทางการ</label>
              <input
                type="text"
                value={formData['HOSPITAL_ADDRESS'] || ''}
                onChange={(e) => handleChange('HOSPITAL_ADDRESS', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์ส่วนกลาง</label>
              <input
                type="text"
                value={formData['HOSPITAL_PHONE'] || ''}
                onChange={(e) => handleChange('HOSPITAL_PHONE', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">ปีงบประมาณปัจจุบัน (พ.ศ.)</label>
              <input
                type="text"
                value={formData['CURRENT_FISCAL_YEAR'] || '2569'}
                onChange={(e) => handleChange('CURRENT_FISCAL_YEAR', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Hospital Director & Signature Settings */}
        <div className="bg-white p-6 rounded-2xl border border-sky-200/80 shadow-sm space-y-5 ring-1 ring-sky-500/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <PenTool className="w-4 h-4 text-sky-600" />
              <span>2. ข้อมูลและลายเซ็นต์ผู้อำนวยการโรงพยาบาล (Hospital Director & Digital Signature)</span>
            </h2>
            <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
              ใช้สำหรับใบประกาศและเอกสารราชการ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ชื่อ-นามสกุล ผู้อำนวยการโรงพยาบาล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData['HOSPITAL_DIRECTOR_NAME'] || ''}
                onChange={(e) => handleChange('HOSPITAL_DIRECTOR_NAME', e.target.value)}
                placeholder="เช่น นายแพทย์ผู้อำนวยการโรงพยาบาลปลวกแดง หรือ นพ. ชวลิต ทิพยมณฑล"
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                ข้อความที่จะปรากฏในวงเล็บใต้ลายเซ็นต์
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ตำแหน่งทางการ (Position Title) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData['HOSPITAL_DIRECTOR_POSITION'] || ''}
                onChange={(e) => handleChange('HOSPITAL_DIRECTOR_POSITION', e.target.value)}
                placeholder="เช่น ผู้อำนวยการโรงพยาบาลปลวกแดง"
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                ระบุตำแหน่งทางการใต้ชื่อ เช่น ผู้อำนวยการโรงพยาบาลปลวกแดง
              </p>
            </div>
          </div>

          {/* Signature File Upload & Live Preview Card */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-sky-600" />
                  <span>ไฟล์ภาพลายเซ็นต์ผู้อำนวยการ (Director Signature Image)</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  รองรับไฟล์ภาพสกุล PNG, JPG, WebP หรือ SVG (แนะนำพื้นหลังโปร่งใส Transparent)
                </p>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleSignatureFileUpload}
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={uploadingSig}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {uploadingSig ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{uploadingSig ? 'กำลังอัปโหลด...' : 'อัปโหลดไฟล์ภาพลายเซ็นต์'}</span>
                </button>
              </div>
            </div>

            {/* Preview Box */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden">
              {currentSigUrl ? (
                <div className="flex flex-col items-center">
                  <div className="relative mb-2 flex items-end justify-center min-h-[75px] max-h-[100px] w-64 border-b border-slate-300 pb-1">
                    <img
                      src={currentSigUrl}
                      alt="ลายเซ็นต์ผู้อำนวยการโรงพยาบาลปลวกแดง"
                      className="max-h-20 max-w-[220px] object-contain select-none pointer-events-none"
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-xs text-slate-800">
                      ({formData['HOSPITAL_DIRECTOR_NAME'] || 'นายแพทย์ผู้อำนวยการโรงพยาบาลปลวกแดง'})
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {formData['HOSPITAL_DIRECTOR_POSITION'] || 'ผู้อำนวยการโรงพยาบาลปลวกแดง'}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      พร้อมใช้งานในระบบ: {currentSigUrl.split('/').pop()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <PenTool className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                  <p className="text-xs font-semibold text-slate-600">ยังไม่มีการบันทึกไฟล์ภาพลายเซ็นต์</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    คลิกปุ่ม &quot;อัปโหลดไฟล์ภาพลายเซ็นต์&quot; หรือเลือกใช้ลายเซ็นต์มาตรฐาน
                  </p>
                </div>
              )}
            </div>

            {/* Presets & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectDefaultSignature}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-[11px] font-semibold transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ใช้ลายเซ็นต์มาตรฐานโรงพยาบาล (Vector SVG)</span>
                </button>
                <button
                  type="button"
                  onClick={handleSelectSampleSignature}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 text-[11px] font-semibold transition-all"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>ใช้ภาพลายเซ็นต์ตัวอย่าง (Sample)</span>
                </button>
              </div>

              {currentSigUrl && (
                <button
                  type="button"
                  onClick={handleClearSignature}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-[11px] font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบภาพลายเซ็นต์</span>
                </button>
              )}
            </div>

            {/* Toggle Enable Digital Signature */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800 text-xs">
                    แสดงภาพลายเซ็นต์ดิจิทัลในใบประกาศและหนังสือราชการ
                  </div>
                  <div className="text-[11px] text-slate-400">
                    หากเปิดใช้งาน ระบบจะนำภาพลายเซ็นต์นี้ไปประทับในใบประกาศนียบัตรและหนังสือตอบรับอัตโนมัติ
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleChange(
                    'HOSPITAL_DIRECTOR_SHOW_SIGNATURE',
                    showSigEnabled ? 'false' : 'true'
                  )
                }
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                  showSigEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    showSigEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Advice Tip */}
            <div className="flex items-start gap-2 p-3 bg-sky-50/70 border border-sky-100 rounded-xl text-[11px] text-slate-600">
              <Info className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
              <span>
                <strong>คำแนะนำเพื่อความคมชัด:</strong> แนะนำให้ใช้ไฟล์ภาพลายเซ็นต์ที่มีพื้นหลังโปร่งใส (Transparent PNG หรือ SVG) ความละเอียดความกว้างประมาณ 300 - 600 px เพื่อให้ภาพลายเซ็นต์คมชัดและแนบสนิทกับเส้นลงนามบนใบประกาศนียบัตรอย่างสวยงาม
              </span>
            </div>
          </div>
        </div>

        {/* Quota & Security Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-sky-600" />
            <span>3. เกณฑ์การแจ้งเตือนและการจัดการโควต้า</span>
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
                className="w-full p-2.5 rounded-xl border border-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20"
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
                className="w-full p-2.5 rounded-xl border border-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20"
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
            <span>4. ข้อมูลผู้รับผิดชอบงานประสานแหล่งฝึกส่วนกลาง</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ชื่อผู้รับผิดชอบหลัก</label>
              <input
                type="text"
                value={formData['TRAINING_COORDINATOR_NAME'] || ''}
                onChange={(e) => handleChange('TRAINING_COORDINATOR_NAME', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">อีเมลงานฝึกอบรม</label>
              <input
                type="email"
                value={formData['TRAINING_COORDINATOR_EMAIL'] || ''}
                onChange={(e) => handleChange('TRAINING_COORDINATOR_EMAIL', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 disabled:opacity-50 transition-all active:scale-[0.99]"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
