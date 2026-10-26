// AgeMate: exact age and next birthday, using the user's local calendar date
const form = document.getElementById('ageForm');
const dobInput = document.getElementById('dob');
const errorBox = document.getElementById('error');
const results = document.getElementById('results');
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/* ---------- Date helpers ---------- */

// Today's date at midnight, in the user's local time zone
function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Turns "2000-05-17" into a local date.
// (new Date("2000-05-17") is read as UTC and can be one day off, so we build the date ourselves.)
function parseDateInput(value) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const isReal = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isReal ? date : null;
}

// Formats a date as "YYYY-MM-DD" for the input's max attribute
function toInputValue(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate(); // day 0 of next month = last day of this month
}

// Whole days between two dates (rounding avoids daylight-saving hour shifts)
function daysBetween(start, end) {
  return Math.round((end - start) / MS_PER_DAY);
}

/* ---------- Calculations ---------- */

// Convention for short months: if a month has no such day (31 April, 29 February in a
// non-leap year), the last day of that month is used. 29 February becomes 28 February.
function clampedDate(year, monthIndex, day) {
  const first = new Date(year, monthIndex, 1); // also fixes months above 11 or below 0
  const lastDay = daysInMonth(first.getFullYear(), first.getMonth());
  return new Date(first.getFullYear(), first.getMonth(), Math.min(day, lastDay));
}

// Count whole months from the birth date, then count the leftover days
function calculateAge(birth, today) {
  const monthAfterBirth = count => clampedDate(birth.getFullYear(), birth.getMonth() + count, birth.getDate());
  let totalMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  if (monthAfterBirth(totalMonths) > today) totalMonths--; // this month's "monthiversary" has not happened yet
  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
    days: daysBetween(monthAfterBirth(totalMonths), today)
  };
}

// Same short-month rule as above, so the age and the birthday always agree
function getNextBirthday(birth, today) {
  let next = clampedDate(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < today) next = clampedDate(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
  return next; // if the birthday is today, it is returned as today (0 days left)
}

/* ---------- Showing results and errors ---------- */

function plural(count, word) {
  return `${count.toLocaleString()} ${word}${count === 1 ? '' : 's'}`;
}

function showError(message) {
  errorBox.textContent = message;
  dobInput.setAttribute('aria-invalid', 'true');
  results.hidden = true; // never show old results next to an error
}

function clearError() {
  errorBox.textContent = '';
  dobInput.removeAttribute('aria-invalid');
}

function showResults(birth, today) {
  const age = calculateAge(birth, today);
  const totalDays = daysBetween(birth, today);
  const nextBirthday = getNextBirthday(birth, today);
  const daysLeft = daysBetween(today, nextBirthday);

  document.getElementById('years').textContent = age.years;
  document.getElementById('months').textContent = age.months;
  document.getElementById('days').textContent = age.days;
  document.getElementById('totalDays').textContent = totalDays.toLocaleString();
  document.getElementById('totalWeeks').textContent = Math.floor(totalDays / 7).toLocaleString();
  document.getElementById('nextDate').textContent = nextBirthday.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  document.getElementById('daysLeft').textContent =
    daysLeft === 0 ? 'Today. Happy birthday!' : plural(daysLeft, 'day');
  results.hidden = false;
}

/* ---------- Events ---------- */

form.addEventListener('submit', event => {
  event.preventDefault(); // keep the page from reloading
  const today = getToday();

  if (!dobInput.value) return showError('Please enter your date of birth.');
  const birth = parseDateInput(dobInput.value);
  if (!birth || birth.getFullYear() < 1900) return showError('Please enter a real date from 1900 onwards.');
  if (birth > today) return showError('Your birth date cannot be in the future.');

  clearError();
  showResults(birth, today);
});

document.getElementById('resetBtn').addEventListener('click', () => {
  form.reset(); // empties the date input
  clearError();
  results.hidden = true;
  dobInput.focus();
});

dobInput.max = toInputValue(getToday()); // the date picker blocks future dates
