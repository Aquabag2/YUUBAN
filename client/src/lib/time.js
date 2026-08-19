export const timeToMinutes = (time) => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};

export const addMinutes = (time, minutes) => {
  const [hour, minute] = time.split(':').map(Number);
  const total = hour * 60 + minute + minutes;
  const next = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(next / 60)).padStart(2, '0')}:${String(next % 60).padStart(2, '0')}`;
};
