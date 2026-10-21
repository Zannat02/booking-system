// Asia/Dhaka = UTC+06:00
const OFFSET_HOURS = 6;
const OFFSET = "+06:00";
const DAY_MS = 24 * 60 * 60 * 1000;

// dateStr: "2026-11-10"
export const getDayRange = (dateStr: string) => {
  const start = new Date(`${dateStr}T00:00:00${OFFSET}`);
  const end = new Date(start.getTime() + DAY_MS);
  return { start, end };
};


export const getTodayRange = () => {
  const dhakaNow = new Date(Date.now() + OFFSET_HOURS * 60 * 60 * 1000);
  const dateStr = dhakaNow.toISOString().slice(0, 10);
  return getDayRange(dateStr);
};