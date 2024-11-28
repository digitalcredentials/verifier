import { getConfig } from './config.js'
/**
 * Returns the names of any known DID registries in which the VC's issuer appears.
 *
 * @returns A list of names of DID registries the issuer appears in.
 */
export function getRelevantRegistryNames({ issuer }) {
  const { registries } = getConfig()
  const issuerDid = typeof issuer === 'string' ? issuer : issuer.id
  const issuerInfo = registries.didEntry(issuerDid)
  // See if the issuer DID appears in any of the known registries
  // If yes, assemble a list of registries it appears in
  return issuerInfo?.inRegistries
    ? Array.from(issuerInfo.inRegistries).map((r) => r.name)
    : null
}
