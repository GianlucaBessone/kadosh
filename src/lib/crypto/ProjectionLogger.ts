export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
  SECURITY = 'SECURITY'
}

export class ProjectionLogger {
  static log(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [PROJECTION] [${level}] ${message}`;
    
    switch (level) {
      case LogLevel.INFO:
        console.log(formattedMessage, meta || '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, meta || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
      case LogLevel.SECURITY:
        console.error(formattedMessage, meta || '');
        break;
    }

    // In a future iteration, we could persist logs to IndexedDB or sync them to cloud.
  }

  static info(message: string, meta?: any) { this.log(LogLevel.INFO, message, meta); }
  static warn(message: string, meta?: any) { this.log(LogLevel.WARN, message, meta); }
  static error(message: string, meta?: any) { this.log(LogLevel.ERROR, message, meta); }
  static critical(message: string, meta?: any) { this.log(LogLevel.CRITICAL, message, meta); }
  static security(message: string, meta?: any) { this.log(LogLevel.SECURITY, message, meta); }
}
