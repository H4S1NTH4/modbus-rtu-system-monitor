/**
 * CRON Expression Utility Functions
 * Supports 6-field format: second minute hour day month day-of-week
 */

/**
 * Generates a 6-field CRON expression from field state
 * @param {Object} fields - Field state object
 * @returns {string} CRON expression (e.g., "0 0 * * * *")
 */
export const generateCronExpression = (fields) => {
  const fieldOrder = ['second', 'minute', 'hour', 'day', 'month', 'dayOfWeek'];

  const parts = fieldOrder.map((fieldName) => {
    const field = fields[fieldName];

    switch (field.type) {
      case 'every':
        return '*';

      case 'specific':
        return field.value || '*';

      case 'everyN': {
        const step = parseInt(field.step) || 1;
        return step === 1 ? '*' : `*/${step}`;
      }

      case 'range': {
        const from = field.from || '0';
        const to = field.to || '59';
        const rangeStep = field.step ? `/${field.step}` : '';
        return `${from}-${to}${rangeStep}`;
      }

      case 'list':
        return field.list || '*';

      default:
        return '*';
    }
  });

  return parts.join(' ');
};

/**
 * Parses a CRON expression into field state
 * Supports both 5-field (backward compat) and 6-field format
 * @param {string} cronStr - CRON expression
 * @returns {Object|null} Field state object or null if invalid
 */
export const parseCronExpression = (cronStr) => {
  if (!cronStr || typeof cronStr !== 'string') return null;

  const parts = cronStr.trim().split(/\s+/);

  let fieldValues;
  if (parts.length === 5) {
    // Prepend '0' for seconds if 5-field format
    fieldValues = ['0', ...parts];
  } else if (parts.length === 6) {
    fieldValues = parts;
  } else {
    return null; // Invalid format
  }

  const fieldNames = ['second', 'minute', 'hour', 'day', 'month', 'dayOfWeek'];
  const fields = {};

  fieldNames.forEach((name, index) => {
    fields[name] = parseFieldValue(fieldValues[index]);
  });

  return fields;
};

/**
 * Parses a single CRON field value into field state
 * Supports: star (every), specific values, everyN, range, list
 * @param {string} value - Field value
 * @returns {Object} Field state object
 */
const parseFieldValue = (value) => {
  // Case 1: Every (*)
  if (value === '*') {
    return { type: 'every', value: '*', from: '', to: '', step: '', list: '' };
  }

  // Case 2: Every N (*/n)
  if (value.startsWith('*/')) {
    const step = value.substring(2);
    return { type: 'everyN', value, from: '', to: '', step, list: '' };
  }

  // Case 3: Range (n-m or n-m/step)
  if (value.includes('-')) {
    const [range, step] = value.split('/');
    const [from, to] = range.split('-');
    return {
      type: 'range',
      value,
      from,
      to,
      step: step || '',
      list: ''
    };
  }

  // Case 4: List (1,2,3)
  if (value.includes(',')) {
    return { type: 'list', value, from: '', to: '', step: '', list: value };
  }

  // Case 5: Specific value
  return { type: 'specific', value, from: '', to: '', step: '', list: '' };
};

/**
 * Generates human-readable description of CRON schedule
 * @param {Object} fields - Field state object
 * @returns {string} Human-readable description
 */
export const getHumanReadable = (fields) => {
  const expression = generateCronExpression(fields);

  // Common presets
  const presets = {
    '*/30 * * * * *': 'Every 30 seconds',
    '0 * * * * *': 'Every minute',
    '0 */5 * * * *': 'Every 5 minutes',
    '0 */10 * * * *': 'Every 10 minutes',
    '0 */15 * * * *': 'Every 15 minutes',
    '0 */30 * * * *': 'Every 30 minutes',
    '0 0 * * * *': 'Every hour',
    '0 0 0 * * *': 'Daily at midnight',
    '0 0 9 * * *': 'Daily at 9:00 AM',
    '0 0 9 * * 1-5': 'Every weekday at 9:00 AM',
    '0 0 0 1 * *': 'Monthly on the 1st at midnight',
    '0 0 0 ? * 0': 'Every Sunday at midnight',
    '0 0 0 ? * 1': 'Every Monday at midnight'
  };

  if (presets[expression]) {
    return presets[expression];
  }

  // Build dynamic description
  const parts = [];
  const { second, minute, hour, day, month, dayOfWeek } = fields;

  // Time components
  if (second.type === 'everyN' && second.step) {
    parts.push(`Every ${second.step} seconds`);
  } else if (minute.type === 'everyN' && minute.step) {
    parts.push(`Every ${minute.step} minutes`);
  } else if (hour.type === 'everyN' && hour.step) {
    parts.push(`Every ${hour.step} hours`);
  } else if (
    hour.type === 'specific' &&
    minute.type === 'specific' &&
    second.type === 'specific'
  ) {
    const timeStr = formatTime(hour.value, minute.value, second.value);
    parts.push(`At ${timeStr}`);
  } else if (hour.type === 'specific' && minute.type === 'specific') {
    const timeStr = formatTimeHM(hour.value, minute.value);
    parts.push(`At ${timeStr}`);
  }

  // Day of week
  if (dayOfWeek.type === 'specific') {
    const dayName = getDayOfWeekName(dayOfWeek.value);
    if (dayName) parts.push(`on ${dayName}`);
  } else if (dayOfWeek.type === 'range') {
    const fromDay = getDayOfWeekName(dayOfWeek.from);
    const toDay = getDayOfWeekName(dayOfWeek.to);
    if (fromDay && toDay) {
      parts.push(`${fromDay} through ${toDay}`);
    }
  } else if (dayOfWeek.type === 'list') {
    const days = dayOfWeek.list
      .split(',')
      .map((d) => getDayOfWeekName(d.trim()))
      .filter(Boolean);
    if (days.length > 0) {
      parts.push(`on ${days.join(', ')}`);
    }
  }

  // Day of month
  if (
    dayOfWeek.type === 'every' &&
    day.type === 'specific' &&
    day.value !== '*'
  ) {
    parts.push(`on day ${day.value}`);
  }

  // Month
  if (month.type === 'specific' && month.value !== '*') {
    const monthName = getMonthName(month.value);
    if (monthName) parts.push(`in ${monthName}`);
  } else if (month.type === 'list' && month.list) {
    const months = month.list
      .split(',')
      .map((m) => getMonthName(m.trim()))
      .filter(Boolean);
    if (months.length > 0) {
      parts.push(`in ${months.join(', ')}`);
    }
  }

  return parts.length > 0 ? parts.join(' ') : 'Custom schedule';
};

/**
 * Helper: Format time as HH:MM:SS AM/PM
 */
const formatTime = (hour, minute, second) => {
  const h = parseInt(hour) || 0;
  const m = parseInt(minute) || 0;
  const s = parseInt(second) || 0;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} ${ampm}`;
};

/**
 * Helper: Format time as HH:MM AM/PM
 */
const formatTimeHM = (hour, minute) => {
  const h = parseInt(hour) || 0;
  const m = parseInt(minute) || 0;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

/**
 * Helper: Get day of week name
 */
const getDayOfWeekName = (dayNum) => {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];
  const index = parseInt(dayNum);
  return days[index] || null;
};

/**
 * Helper: Get month name
 */
const getMonthName = (monthNum) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  const index = parseInt(monthNum) - 1;
  return months[index] || null;
};
