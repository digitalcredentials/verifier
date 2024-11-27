let CONFIG
const defaultPort = 4009
const defaultConsoleLogLevel = 'silly'
const defaultLogLevel = 'silly'

export function setConfig() {
  CONFIG = parseConfig()
}

function parseConfig() {
  const env = process.env
  const config = Object.freeze({
    port: env.PORT ? parseInt(env.PORT) : defaultPort,
    enableAccessLogging: env.ENABLE_ACCESS_LOGGING?.toLowerCase() === 'true',
    consoleLogLevel:
      env.CONSOLE_LOG_LEVEL?.toLocaleLowerCase() || defaultConsoleLogLevel,
    logLevel: env.LOG_LEVEL?.toLocaleLowerCase() || defaultLogLevel,
    errorLogFile: env.ERROR_LOG_FILE,
    logAllFile: env.LOG_ALL_FILE
  })
  return config
}

export function getConfig() {
  if (!CONFIG) {
    setConfig()
  }
  return CONFIG
}
