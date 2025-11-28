/**
 * Get current time formatted as DD-MM-YYYY HH:MM:SS:xxx (xxx = milliseconds)
 * @returns Promise<string> - Formatted time string
 */
export async function currentTime(): Promise<string> {
  const now = new Date();

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

  return `${hours}:${minutes}:${seconds}:${milliseconds}`;
}

export async function currentDay(): Promise<string> {
  const now = new Date();

  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  return `${day}-${month}-${year}`;
}
