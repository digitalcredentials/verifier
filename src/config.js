import { RegistryClient } from '@digitalcredentials/issuer-registry-client'
import knownDidRegistries from '../.knownDidRegistries.js'

let CONFIG
const defaultPort = 4009
const defaultConsoleLogLevel = 'silly'
const defaultLogLevel = 'silly'
const registries = new RegistryClient()
await registries.load({ config: knownDidRegistries })

export function setConfig() {
  const env = process.env
  CONFIG = {
    port: env.PORT ? parseInt(env.PORT) : defaultPort,
    enableAccessLogging: env.ENABLE_ACCESS_LOGGING?.toLowerCase() === 'true',
    consoleLogLevel:
      env.CONSOLE_LOG_LEVEL?.toLocaleLowerCase() || defaultConsoleLogLevel,
    logLevel: env.LOG_LEVEL?.toLocaleLowerCase() || defaultLogLevel,
    errorLogFile: env.ERROR_LOG_FILE,
    logAllFile: env.LOG_ALL_FILE,
    registries
  }
}

export function getConfig() {
  if (!CONFIG) {
    setConfig()
  }
  return CONFIG
}
