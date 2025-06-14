// src/lib/adminLogger.ts
// Simple logger for admin actions

/**
 * Log admin actions with different severity levels
 * @param action The action being performed
 * @param details Additional details about the action
 * @param level Log level (INFO, WARN, ERROR)
 */
export function adminLogger(action: string, details: any, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [ADMIN LOG] [${level}] ${action}`;
  
  if (level === 'ERROR') {
    console.error(logEntry, details);
  } else if (level === 'WARN') {
    console.warn(logEntry, details);
  } else {
    console.log(logEntry, details);
  }
  
  // Store admin logs in localStorage for the config page
  try {
    const existingLogs = JSON.parse(localStorage.getItem('adminExecutionLogs') || '[]');
    const newLog = {
      timestamp,
      level,
      action: action,
      details: typeof details === 'object' ? JSON.stringify(details, null, 2) : String(details)
    };
    
    existingLogs.unshift(newLog); // Add to beginning
    
    // Keep only last 100 logs to prevent storage overflow
    if (existingLogs.length > 100) {
      existingLogs.splice(100);
    }
    
    localStorage.setItem('adminExecutionLogs', JSON.stringify(existingLogs));
  } catch (error) {
    console.error('[ADMIN LOG] Failed to store admin log:', error);
  }
}