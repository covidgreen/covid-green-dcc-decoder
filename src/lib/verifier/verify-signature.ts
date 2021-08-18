import cose from 'cose-js'
import cbor from 'cbor'
import NodeRSA from 'node-rsa'

import { SigningKey } from '../../types'
import { ALGOS, CBOR_STRUCTURE } from '../../types/hcert'

import * as errors from './errors'

async function verifyECDSA(
  message: Buffer,
  keys: SigningKey[]
): Promise<boolean | Error> {
  for (const key of keys) {
    try {
      const verifiedBuf = await cose.sign.verify(message, {
        key: {
          kid: key.kid,
          x: Buffer.from(key.x, 'base64'),
          y: Buffer.from(key.y, 'base64'),
        },
      })
      if (verifiedBuf) {
        console.log('key worked', key.kid, key.country)
        return true
      }
    } catch (e) {
      console.log('Sig failed', key.kid, e)
    }
  }
  return errors.invalidSignature()
}

const EMPTY_BUFFER = Buffer.alloc(0)
const rsaOptions = {
  signingScheme: {
    scheme: 'pss',
    hash: 'sha256',
    saltLength: 32,
  },
}

async function verifyRSA(
  message: Buffer,
  keys: SigningKey[]
): Promise<boolean | Error> {
  const decoded = cbor.decodeFirstSync(Buffer.from(message)).value
  const protectedHeader = decoded[CBOR_STRUCTURE.PROTECTED_HEADER].length
    ? decoded[CBOR_STRUCTURE.PROTECTED_HEADER]
    : cbor.encode(EMPTY_BUFFER)
  const signature = decoded[CBOR_STRUCTURE.SIGNATURE]

  const sigStructure = [
    'Signature1',
    protectedHeader,
    EMPTY_BUFFER,
    decoded[CBOR_STRUCTURE.PAYLOAD],
  ]
  const toBeSigned = cbor.encode(sigStructure)

  for (const key of keys) {
    try {
      const rsa = new NodeRSA(key.pem, 'pkcs8-public-pem')
      rsa.setOptions(rsaOptions)
      const result = rsa.verify(toBeSigned, signature, 'buffer')

      console.log('RESULT:', result)
      if (result) {
        console.log('key worked', key.kid, key.country)
        return true
      }
    } catch (e) {
      console.log('Sig failed', key.kid, e)
    }
  }

  return errors.invalidSignature()
}

export default async function verifySignature(
  message: Buffer,
  algo: ALGOS,
  keys: SigningKey[]
): Promise<boolean | Error> {
  if (algo === ALGOS.ECDSA_256) {
    return verifyECDSA(message, keys)
  } else if (algo === ALGOS.RSA_PSS_256) {
    return verifyRSA(message, keys)
  } else {
    return errors.unknownSigAlgo()
  }
}
