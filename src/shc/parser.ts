import zlib from 'zlib'

import jose from 'node-jose'

import { SigningKey } from '../types'

/**
 * Convert a SHC raw string to a standard JWT
 * @param {string} rawSHC The raw 'shc://' string (from a QR code)
 * @return {string} The encoded JWT
 */
export function numericShcToJwt(rawSHC) {
  if (rawSHC.startsWith('shc:/')) {
    rawSHC = rawSHC.split('/')[1]
  }

  return rawSHC
    .match(/(..?)/g)
    .map(number => String.fromCharCode(parseInt(number, 10) + 45))
    .join('')
}

/**
 * Decode the JWT header and return it as an object
 * @param {string} header Base64 encoded header
 * @return {object} The decoded header
 */
export function parseJwtHeader(header) {
  const headerData = Buffer.from(header, 'base64').toString()
  return JSON.parse(headerData)
}

/**
 * Decode and extract the JWT payload
 * @param {string} payload Base64 encoded + zlib compressed jwt payload
 * @return {object} The decoded payload
 */
export function parseJwtPayload(payload) {
  const buffer = Buffer.from(payload, 'base64')
  const payloadJson = zlib.inflateRawSync(buffer).toString()
  return JSON.parse(payloadJson)
}

/**
 * Verify the signature of a JWT with the given keys.
 * Tries all and returns true if it finds the right one.
 *
 * @param {string} jwt JWT to verify
 * @param {string} issuer The expected issuer of the JWT
 * @return boolean
 */
export async function verifySignature(
  jwt: string,
  key: SigningKey
): Promise<boolean | Error> {
  try {
    const keystore = await jose.JWK.asKey(key)
    const result = await jose.JWS.createVerify(keystore).verify(jwt)

    if (result) return true
  } catch (err) {
    console.log('Sig failed', key.kid, err)
    return false
  }
}
