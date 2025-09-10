import moment from 'moment';

export class TimestampManager {
  static getTimestamp(): string {
    // Format: 2024-03-15-14-30-45
    return moment().format('YYYY-MM-DD-HH-mm-ss');
  }
  
  static getReadableTimestamp(): string {
    // Format: "15 Mars 2024 à 14h30"
    moment.locale('fr');
    return moment().format('DD MMMM YYYY [à] HH[h]mm');
  }
  
  static getLogTimestamp(): string {
    // Format: [2024-03-15 14:30:45.123]
    return `[${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}]`;
  }
  
  static getFolderName(appName: string): string {
    // Format: 2024-03-15-14-30-45-app-name
    const timestamp = this.getTimestamp();
    const cleanAppName = appName.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return `${timestamp}-${cleanAppName}`;
  }

  static getSessionId(): string {
    // Format court pour session ID
    return moment().format('YYYY-MM-DD-HH-mm-ss');
  }

  static parseTimestampFromPath(path: string): moment.Moment | null {
    const match = path.match(/(\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2})/);
    if (match) {
      return moment(match[1], 'YYYY-MM-DD-HH-mm-ss');
    }
    return null;
  }
}

// Backward compatibility functions
export function generateTimestamp(): string {
  return TimestampManager.getTimestamp().replace(/-/g, '_').substring(0, 19);
}

export function generateDateTimestamp(): string {
  return moment().format('YYYY-MM-DD');
}

export function generateFullTimestamp(): string {
  return moment().format('YYYY-MM-DD HH:mm:ss');
}

export function generateISOTimestamp(): string {
  return moment().toISOString();
}

export function formatDuration(milliseconds: number): string {
  const duration = moment.duration(milliseconds);
  
  if (duration.hours() > 0) {
    return `${duration.hours()}h ${duration.minutes()}m ${duration.seconds()}s`;
  } else if (duration.minutes() > 0) {
    return `${duration.minutes()}m ${duration.seconds()}s`;
  } else {
    return `${duration.seconds()}.${Math.floor(duration.milliseconds() / 10)}s`;
  }
}

export function getAgeInDays(timestamp: string): number {
  const date = moment(timestamp, 'YYYY-MM-DD_HH-mm-ss');
  const now = moment();
  return now.diff(date, 'days');
}

export function isOlderThanDays(timestamp: string, days: number): boolean {
  return getAgeInDays(timestamp) > days;
}