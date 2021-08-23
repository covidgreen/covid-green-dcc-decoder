import fetch from 'node-fetch'

import { DCCData, SigningKeys, Valueset, Valuesets } from './types'
import { RuleSet } from './rules-runner/types'
import {
  CertificateContent,
  CERT_TYPE,
  RecoveryGroup,
  TestGroup,
  VaccinationGroup,
} from './types/hcert'

import { buildValuesetsComputed } from '.'

export function mapToJSON(map) {
  if (!(map instanceof Map)) return map
  const out = Object.create(null)

  map.forEach((value, key) => {
    if (value instanceof Map) {
      out[key] = mapToJSON(value)
    } else {
      out[key] = value
    }
  })

  return out
}

export async function getDCCData(url: string): Promise<DCCData> {
  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (resp.status === 200) {
    const body = await resp.json()

    return {
      signingKeys: body.certs as SigningKeys,
      ruleSet: body.rules as RuleSet,
      valueSets: {
        countryCodes: body.valueSets.countryCodes.valueSetValues,
        diseaseAgentTargeted:
          body.valueSets.diseaseAgentTargeted.valueSetValues,
        testManf: body.valueSets.testManf.valueSetValues,
        testResult: body.valueSets.testResult.valueSetValues,
        testType: body.valueSets.testType.valueSetValues,
        vaccineMahManf: body.valueSets.vaccineMahManf.valueSetValues,
        vaccineMedicinalProduct:
          body.valueSets.vaccineMedicinalProduct.valueSetValues,
        vaccineProphylaxis: body.valueSets.vaccineProphylaxis.valueSetValues,
      },
      valuesetsComputed: buildValuesetsComputed(body.valueSets),
    }
  }

  const data = resp.json ? await resp.json() : 'Unable to request data'

  throw new Error(data)
}

function getValue(
  valueset: Record<string, Valueset>,
  key: string,
  defaultValue: string = key
): string {
  return valueset[key]?.display || defaultValue
}

const populateVaccineCert = (
  cert: VaccinationGroup,
  valueSets: Valuesets
): VaccinationGroup => {
  return {
    ...cert,
    tg: getValue(valueSets.diseaseAgentTargeted, cert.tg),
    vp: getValue(valueSets.vaccineProphylaxis, cert.vp),
    mp: getValue(valueSets.vaccineMedicinalProduct, cert.mp),
    ma: getValue(valueSets.vaccineMahManf, cert.ma),
    co: getValue(valueSets.countryCodes, cert.co),
  }
}

const populateTestCert = (cert: TestGroup, valueSets: Valuesets): TestGroup => {
  return {
    ...cert,
    tg: getValue(valueSets.diseaseAgentTargeted, cert.tg),
    tt: getValue(valueSets.testType, cert.tt),
    ma: getValue(valueSets.vaccineMahManf, cert.ma),
    tr: getValue(valueSets.testResult, cert.tr),
    co: getValue(valueSets.countryCodes, cert.co),
  }
}

const populateRecoveryCert = (
  cert: RecoveryGroup,
  valueSets: Valuesets
): RecoveryGroup => {
  return {
    ...cert,
    tg: getValue(valueSets.diseaseAgentTargeted, cert.tg),
    co: getValue(valueSets.countryCodes, cert.co),
  }
}

export function populateCertValues(
  cert: CertificateContent,
  type: CERT_TYPE,
  valueSets: Valuesets
): CertificateContent {
  const populatedCert: CertificateContent = {
    nam: cert.nam,
    dob: cert.dob,
    ver: cert.ver,
  }

  if (type === CERT_TYPE.VACCINE) {
    populatedCert.v = [populateVaccineCert(cert.v[0], valueSets)]
  } else if (type === CERT_TYPE.TEST) {
    populatedCert.t = [populateTestCert(cert.t[0], valueSets)]
  } else if (type === CERT_TYPE.RECOVERY) {
    populatedCert.r = [populateRecoveryCert(cert.r[0], valueSets)]
  }

  return populatedCert
}
