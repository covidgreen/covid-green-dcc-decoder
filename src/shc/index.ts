import {
  CertificateContent,
  CERT_TYPE,
  SigningKeys,
  VaccinationGroup,
  VerificationResult,
} from '../'
import * as errors from '../types/errors'

import { vaccineCodes } from './codes'
import {
  numericShcToJwt,
  parseJwtHeader,
  parseJwtPayload,
  verifySignature,
} from './parser'

type EntryType = 'Patient' | 'Immunization'

function getEntries(payload, type: EntryType) {
  return payload.vc.credentialSubject.fhirBundle.entry.flatMap(e =>
    e.resource.resourceType === type ? [e.resource] : []
  )
}

function convertShc(payload, country: string): CertificateContent {
  const [patient] = getEntries(payload, 'Patient')

  const fn: string = patient.name[0].family
  const gn: string = patient.name[0].given.join(' ')
  const fnt: string = fn // TODO: how to convert this
  const gnt: string = gn // TODO: how to convert this

  const dob: string = patient.birthDate

  const doses = getEntries(payload, 'Immunization')
  const lastDose = doses[doses.length - 1]

  const vax = vaccineCodes[lastDose.vaccineCode.coding[0].code]

  const tg = '840539006'
  const vp = vax.vp
  const mp = vax.mp
  const ma = vax.ma
  const dn = doses.length
  const sd = 2
  const dt: string = lastDose.occurrenceDateTime
  const co = country
  const is = payload.iss
  const ci = ''

  const v: VaccinationGroup = { tg, vp, mp, dn, sd, dt, co, is, ci, ma }

  const cert = {
    ver: '1.0.0',
    nam: { fn, gn, fnt, gnt },
    dob,
    v: [v],
  }

  return cert
}

/**
 * Extract data from a raw 'shc://' string
 * @param {string} rawSHC The raw 'shc://' string (from a QR code)
 * @return The header, payload and verification result of the SHC
 */
export const decodeShc = async (
  rawSHC: string,
  keys: SigningKeys
): Promise<VerificationResult> => {
  const jwt = numericShcToJwt(rawSHC)
  const splitJwt = jwt.split('.')
  const header = parseJwtHeader(splitJwt[0])
  const payload = parseJwtPayload(splitJwt[1])
  const key = keys.find(k => k.kid === header.kid)

  if (!key) throw new Error('No key')

  const result = await verifySignature(jwt, key)

  if (!result) {
    return { error: errors.invalidSignature() }
  }

  const country = key.country?.split('-')[0] || key.country || ''

  return {
    rawCert: convertShc(payload, country),
    type: CERT_TYPE.VACCINE,
  }
}
