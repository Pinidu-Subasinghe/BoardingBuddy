const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

const pad2 = (value) => String(value).padStart(2, "0");

export const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const year = date.getFullYear();
  const month = MONTHS[date.getMonth()];
  const day = pad2(date.getDate());
  return `${year} ${month} ${day}`;
};

export const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const hours = date.getHours();
  const minutes = pad2(date.getMinutes());
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${pad2(hour12)}:${minutes} ${period}`;
};

export const formatDateTime = (value) => {
  const date = formatDate(value);
  if (date === "—") return date;
  const time = formatTime(value);
  return time ? `${date} ${time}` : date;
};
