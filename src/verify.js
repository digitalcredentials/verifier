import { Ed25519Signature2020 } from '@digitalbazaar/ed25519-signature-2020'
//import { purposes } from 'jsonld-signatures'
import * as vc from '@digitalbazaar/vc'
//import { VerifiablePresentation, PresentationError } from 'types/presentation.d';
//import { VerifiableCredential, CredentialError, CredentialErrorTypes } from 'types/credential.d';
import { securityLoader } from '@digitalcredentials/security-document-loader'
import { registryCollections } from '@digitalcredentials/issuer-registry-client'
import { getCredentialStatusChecker } from './credentialStatus.js'

const documentLoader = securityLoader({ fetchRemoteContexts: true }).build()
const suite = new Ed25519Signature2020()
//const presentationPurpose = new purposes.AssertionProofPurpose()

const PresentationError = {
  IsNotVerified: 'Presentation is not verified.',
  CouldNotBeVerified:
    'Presentation encoded could not be checked for verification and may be malformed.'
}

const CredentialErrorTypes = {
  IsNotVerified: 'Credential is not verified.',
  CouldNotBeVerified:
    'Credential could not be checked for verification and may be malformed.',
  DidNotInRegistry: 'Could not find issuer in registry with given DID.'
}

/* 
export type ResultLog = {
  id: string,
  valid: boolean
}

export type Result = {
  verified: boolean;
  credential: VerifiableCredential;
  error: CredentialError;
  log: ResultLog[];
  registryName?: string;
}

export type VerifyResponse = {
  verified: boolean;
  results: Result[];
} */

export async function verifyPresentation(
  presentation,
  unsignedPresentation = true
) {
  try {
    const result = await vc.verify({
      presentation,
      //   presentationPurpose,
      suite,
      documentLoader,
      unsignedPresentation
    })

    return result
  } catch (err) {
    console.warn(err)
    throw new Error(PresentationError.CouldNotBeVerified)
  }
}

export async function verifyCredential(credential) {
  const { issuer } = credential

  if (!checkID(credential)) {
    return createFatalErrorResult(
      credential,
      "The credential's id uses an invalid format. It may have been issued as part of an early pilot. Please contact the issuer to get a replacement."
    )
  }

  const { malformed, message } = checkMalformed(credential)
  if (malformed) {
    return createFatalErrorResult(credential, message)
  }

  if (credential?.proof?.type === 'DataIntegrityProof') {
    return createFatalErrorResult(
      credential,
      `Proof type not supported: DataIntegrityProof (cryptosuite: ${credential.proof.cryptosuite}).`
    )
  }

  try {
    const checkStatus = credential.credentialStatus
      ? getCredentialStatusChecker(credential)
      : undefined

    /*
    basic structure of object returned from verifyCredential call
    {
        verified: false,
        results: [{credential, verified: false, error}],
        error
      };
    */
    const result = await vc.verifyCredential({
      credential,
      suite,
      documentLoader,
      // Only check revocation status if VC has a 'credentialStatus' property
      checkStatus
    })
    console.log(JSON.stringify(result))
    result.fatal = false
    if (result?.error?.name === 'VerificationError') {
      return createFatalErrorResult(
        credential,
        CredentialErrorTypes.CouldNotBeVerified
      )
    }

    if (result.statusResult?.verified === false) {
      ;(result.results[0].log ??= []).push({
        id: 'revocation_status',
        valid: false
      })
      if (result.statusResult.error) {
        result.hasStatusError = true
      }
    }

    if (!result.results) {
      result.results = [{}]
    }

    for (const res of result.results) {
      if (!res.credential) {
        res.credential = credential
      }
    }

    const issuerDid = typeof issuer === 'string' ? issuer : issuer.id
    await registryCollections.issuerDid.fetchRegistries()
    const isInRegistry =
      await registryCollections.issuerDid.isInRegistryCollection(issuerDid)
    if (isInRegistry) {
      const registryInfo =
        await registryCollections.issuerDid.registriesFor(issuerDid)
      result.registryName = registryInfo[0].name
    } else {
      result.verified = false
      ;(result.results[0].log ??= []).push({
        id: 'issuer_did_resolves',
        valid: false
      })
      addErrorToResult(result, CredentialErrorTypes.DidNotInRegistry, false)
    }

    return result
  } catch (err) {
    console.warn(err)
    //throw new Error(CredentialErrorTypes.CouldNotBeVerified);
    return createFatalErrorResult(
      credential,
      CredentialErrorTypes.CouldNotBeVerified
    )
  }
}

function checkMalformed(credential) {
  let message = ''
  let malformed = false
  // check credential for proof
  if (!credential.proof) {
    message +=
      'This is not a Verifiable Credential (does not have a digital signature).'
    malformed = true
  }

  return { malformed, message }
}

function checkID(credential) {
  try {
    new URL(credential.id)
  } catch (e) {
    return false
  }
  return true
}

function createFatalErrorResult(credential, message) {
  const result = {
    verified: false,
    results: [
      {
        verified: false,
        credential,
        log: [
          { id: 'expiration', valid: false },
          { id: 'valid_signature', valid: false },
          { id: 'issuer_did_resolves', valid: false },
          { id: 'revocation_status', valid: false }
        ]
      }
    ]
  }
  addErrorToResult(result, message, true)
  return result //as VerifyResponse
}

function addErrorToResult(result, message, isFatal = true) {
  result.results[0].error = {
    details: {
      cause: {
        message,
        name: 'Error'
      }
    },
    message,
    name: 'Error',
    isFatal
  }
}
