import base45 from 'base45'
import pako from 'pako'
import cbor from 'cbor'
import cose from 'cose-js'

import {
  ALGOS,
  CBOR_STRUCTURE,
  HEADER_KEYS,
  PAYLOAD_KEYS,
  CertificateContent,
  CERT_TYPE,
} from '../types/hcert'
import { mapToJSON } from '../util'
import { SigningKeys, SigningKey, VerificationResult } from '../types'
import * as errors from '../types/errors'

import verifySignature from './verify-signature'

function getCountry(
  cert: CertificateContent,
  type: CERT_TYPE,
  iss?: string
): string | null {
  try {
    return iss || cert[type][0].co
  } catch (e) {
    return null
  }
}

function getKid(protectedHeader, unprotectedHeader): string | null {
  try {
    if (protectedHeader) {
      return protectedHeader.get(HEADER_KEYS.KID).toString('base64')
    } else {
      return unprotectedHeader.get(HEADER_KEYS.KID).toString('base64')
    }
  } catch {
    return null
  }
}

function getAlgo(protectedHeader, unprotectedHeader): ALGOS | null {
  try {
    if (protectedHeader) {
      return protectedHeader.get(HEADER_KEYS.ALGORITHM)
    } else {
      return unprotectedHeader.get(HEADER_KEYS.ALGORITHM)
    }
  } catch {
    return null
  }
}

function getCertType(cert: CertificateContent): CERT_TYPE {
  // Just checking if key exists does not suffice.
  // It should have an item in the array too.
  // Handles case ES/1.0.0/specialcases/VAC_4.png
  if (cert.v?.[0]) return CERT_TYPE.VACCINE
  if (cert.t?.[0]) return CERT_TYPE.TEST
  if (cert.r?.[0]) return CERT_TYPE.RECOVERY
}

// function getSignature(message): string | null {
//   try {
//     return cbor.decodeFirstSync(message.value[CBOR_STRUCTURE.SIGNATURE])
//   } catch {
//     return null
//   }
// }

function ensureCOSEStructure(qrCbor) {
  const message = cbor.decodeFirstSync(qrCbor)
  if (message instanceof cbor.Tagged && message.tag) {
    return qrCbor
  }

  return cbor.encodeCanonical(new cbor.Tagged(cose.sign.Sign1Tag, message))
}

function decodeCbor(qrCbor): {
  kid: string
  country: string
  issuedAt: number
  expiresAt: number
  rawCert: CertificateContent
  algo: ALGOS
  type: CERT_TYPE
} {
  const message = cbor.decodeFirstSync(qrCbor)

  const protectedHeader = cbor.decodeFirstSync(
    message.value[CBOR_STRUCTURE.PROTECTED_HEADER]
  )
  const unprotectedHeader = message.value[CBOR_STRUCTURE.UNPROTECTED_HEADER]
  const content = cbor.decodeFirstSync(message.value[CBOR_STRUCTURE.PAYLOAD])

  // const signature = getSignature(message)
  const kid = getKid(protectedHeader, unprotectedHeader)
  const algo = getAlgo(protectedHeader, unprotectedHeader)

  const rawCert = mapToJSON(content.get(PAYLOAD_KEYS.CONTENT).get(1))
  const type = getCertType(rawCert)
  const country = getCountry(rawCert, type, content.get(PAYLOAD_KEYS.ISSUER))

  // move into a function as mapping/transformation grows
  if (type === CERT_TYPE.TEST) {
    if (rawCert.t[0].sc instanceof Date) {
      rawCert.t[0].sc = rawCert.t[0].sc.toISOString()
    }
  }

  return {
    kid,
    country,
    issuedAt: content.get(PAYLOAD_KEYS.ISSUED_AT),
    expiresAt: content.get(PAYLOAD_KEYS.EXPIRES_AT),
    rawCert,
    algo,
    type,
  }
}

function findKeysToValidateAgainst(
  country: string,
  kid: string,
  signingKeys: SigningKey[]
): SigningKey[] {
  const keys: SigningKey[] = []

  if (kid) {
    keys.push(...signingKeys.filter(s => s.kid === kid))
  }

  if (keys.length === 0 && !kid) {
    keys.push(...signingKeys.filter(s => s.country === country))
  }
  return keys
}

export default async function decodeQR(
  qr: string,
  signingKeys: SigningKeys
): Promise<VerificationResult> {
  if (!qr.startsWith('HC1:')) {
    return { error: errors.invalidQR() }
  }

  try {
    const qrBase45 = qr.replace('HC1:', '')
    const qrZipped = base45.decode(qrBase45)
    const qrCbor = ensureCOSEStructure(Buffer.from(pako.inflate(qrZipped)))

    // We decode the whole cbor
    const { kid, rawCert, country, expiresAt, algo, type } = decodeCbor(qrCbor)

    const keysToUse = findKeysToValidateAgainst(country, kid, signingKeys)
    /* console.log(
      'Detected',
      JSON.stringify(
        {
          country,
          kid,
          algo,
          expiresAt: new Date(expiresAt * 1000),
          issuedAt: new Date(issuedAt * 1000),
          keysLength: keysToUse.length,
          type,
        },
        null,
        2
      )
    )*/

    if (new Date(expiresAt * 1000) < new Date()) {
      return { rawCert, error: errors.certExpired(), type }
    }

    if (keysToUse.length === 0) {
      return { rawCert, error: errors.noMatchingSigKey(), type }
    }

    const result = await verifySignature(qrCbor, algo, keysToUse)

    const error = result instanceof Error ? result : undefined

    return { rawCert, type, error }
  } catch (err) {
    console.log('Error:', err)
    return { error: errors.invalidData() }
  }
}
