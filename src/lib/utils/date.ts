// Thai Buddhist Year formatting utilities (Timezone: Asia/Bangkok)

const THAI_MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_MONTH_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export function toThaiDate(dateInput: Date | string | null | undefined, format: 'long' | 'short' | 'date-only' = 'long'): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const day = d.getDate();
  const monthIdx = d.getMonth();
  const buddhistYear = d.getFullYear() + 543;

  if (format === 'short') {
    return `${day} ${THAI_MONTH_SHORT[monthIdx]} ${buddhistYear}`;
  }

  if (format === 'date-only') {
    return `${String(day).padStart(2, '0')}/${String(monthIdx + 1).padStart(2, '0')}/${buddhistYear}`;
  }

  return `${day} ${THAI_MONTH_NAMES[monthIdx]} พ.ศ. ${buddhistYear}`;
}

export function toThaiDateTime(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const day = d.getDate();
  const monthIdx = d.getMonth();
  const buddhistYear = d.getFullYear() + 543;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day} ${THAI_MONTH_SHORT[monthIdx]} ${buddhistYear} ${hours}:${minutes} น.`;
}

export function toThaiDateRange(start: Date | string | null | undefined, end: Date | string | null | undefined): string {
  if (!start && !end) return '-';
  if (!end) return toThaiDate(start, 'short');
  if (!start) return toThaiDate(end, 'short');

  const s = new Date(start);
  const e = new Date(end);

  const sDay = s.getDate();
  const sMonth = s.getMonth();
  const sYear = s.getFullYear() + 543;

  const eDay = e.getDate();
  const eMonth = e.getMonth();
  const eYear = e.getFullYear() + 543;

  if (sYear === eYear && sMonth === eMonth) {
    return `${sDay} - ${eDay} ${THAI_MONTH_SHORT[sMonth]} ${sYear}`;
  }

  if (sYear === eYear) {
    return `${sDay} ${THAI_MONTH_SHORT[sMonth]} - ${eDay} ${THAI_MONTH_SHORT[eMonth]} ${sYear}`;
  }

  return `${sDay} ${THAI_MONTH_SHORT[sMonth]} ${sYear} - ${eDay} ${THAI_MONTH_SHORT[eMonth]} ${eYear}`;
}
