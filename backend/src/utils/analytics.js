const DAY_MS = 24 * 60 * 60 * 1000;
const dateKey = (date) => date.toISOString().slice(0, 10);

// All boundary math is done in UTC (matching how MongoDB stores createdAt and
// how dateKey reads it back via toISOString) so bucket boundaries line up
// regardless of the server's local timezone offset.
const utcMidnight = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

export const timelineStartDate = (days = 30) => {
  const today = utcMidnight(new Date());
  return new Date(today.getTime() - (days - 1) * DAY_MS);
};

/**
 * Zero-filled daily view/download counts for the last `days` days
 * (oldest first, today last), from a flat list of { type, createdAt } events.
 */
export const buildDailyTimeline = (events, days = 30) => {
  const start = timelineStartDate(days);

  const buckets = new Map();
  for (let i = 0; i < days; i++) {
    const key = dateKey(new Date(start.getTime() + i * DAY_MS));
    buckets.set(key, { date: key, views: 0, downloads: 0 });
  }

  events.forEach((e) => {
    const bucket = buckets.get(dateKey(new Date(e.createdAt)));
    if (!bucket) return;
    if (e.type === 'view') bucket.views += 1;
    else if (e.type === 'download') bucket.downloads += 1;
  });

  return Array.from(buckets.values());
};
