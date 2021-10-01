import { ValueSetsComputed, RuleSet } from './rules-runner/types'
import decodeQR from './verifier'
import { runRuleSet } from './rules-runner'
import {
  DCCData,
  VerificationResult,
  SigningKeys,
  Valuesets,
  InputSource,
  VaccinationGroup,
  TestGroup,
  RecoveryGroup,
  RuleError,
} from './types'
import { getDCCData, populateCertValues } from './util'
import { extractQRFromImage, extractQRFromPDF } from './decode'
import { CERT_TYPE, CertificateContent } from './types/hcert'

const findQRData = async (source: InputSource): Promise<string[]> => {
  let qrSources = [source.qrData]
  if (source.image) {
    qrSources = await extractQRFromImage(source.image)
  } else if (source.pdf) {
    qrSources = await extractQRFromPDF(source.pdf)
  }

  return qrSources
}

const findRecentResult = (
  results: VerificationResult[]
): VerificationResult => {
  // if vaccine find latest vaccine
  // if recovery find latest
  // if test find latest test
  // if mixture reyurn vaccine / recovery / test

  let latestV: VerificationResult
  let latestR: VerificationResult
  let latestT: VerificationResult

  for (const item of results) {
    if (item.type === CERT_TYPE.VACCINE) {
      if (
        !latestV ||
        new Date(item.rawCert.v[0].dt) > new Date(latestV.rawCert.v[0].dt)
      ) {
        latestV = item
      }
    } else if (item.type === CERT_TYPE.RECOVERY) {
      if (
        !latestR ||
        new Date(item.rawCert.r[0].du) > new Date(latestR.rawCert.r[0].du)
      ) {
        latestR = item
      }
    } else if (item.type === CERT_TYPE.TEST) {
      if (
        !latestT ||
        new Date(item.rawCert.t[0].sc) > new Date(latestT.rawCert.t[0].sc)
      ) {
        latestT = item
      }
    }
  }

  return latestV || latestR || latestT
}

const decodeOnly = async (inputs: {
  source: InputSource
  dccData: DCCData
}): Promise<VerificationResult> => {
  const dcc = inputs.dccData
  if (!(dcc && dcc.signingKeys)) {
    throw new Error('You must provide keys')
  }
  if (!(dcc && dcc.valueSets)) {
    throw new Error('You must provide value sets')
  }

  const qrSources = await findQRData(inputs.source)

  const results = []
  for (const qr of qrSources) {
    const result = await decodeQR(qr, dcc.signingKeys)

    if (result.rawCert) {
      result.cert = populateCertValues(
        result.rawCert,
        result.type,
        dcc.valueSets
      )
      results.push(result)
    }
  }

  return findRecentResult(results)
}

const buildValuesetsComputed = (valuesets): ValueSetsComputed => {
  return Object.keys(valuesets).reduce((acc, key) => {
    acc[valuesets[key].valueSetId] = Object.keys(valuesets[key].valueSetValues)

    return acc
  }, {})
}

const loadDCCConfigData = async (url): Promise<DCCData> => {
  return await getDCCData(url)
}

const decodeAndValidateRules = async (inputs: {
  source: InputSource
  ruleCountry: string
  ruleLang?: string | 'en'
  dccData: DCCData
  validationClock?: string
}): Promise<VerificationResult> => {
  const result = await decodeOnly(inputs)

  if (result.error) {
    return result
  }

  const dcc = inputs.dccData

  const ruleErrors: RuleError[] = []
  const ruleset = dcc.ruleSet && dcc.ruleSet[inputs.ruleCountry]

  if (ruleset) {
    const results = runRuleSet(ruleset, {
      payload: result.rawCert,
      external: {
        valueSets: dcc.valuesetsComputed,
        validationClock: inputs.validationClock
          ? inputs.validationClock
          : new Date().toISOString(),
      },
    })
    // console.log('RESULTS:', results)
    if (results && !results.allSatisfied) {
      Object.keys(results?.ruleEvaluations || {}).forEach(ruleId => {
        const ruleResult = results?.ruleEvaluations[ruleId]
        const rule = ruleset.find(r => r.Identifier === ruleId)

        if (ruleResult === false || ruleResult instanceof Error) {
          const desc =
            rule?.Description?.find(d => d.lang === inputs.ruleLang) ??
            rule?.Description?.find(d => d.lang === 'en')
          ruleErrors.push({ id: ruleId, description: desc?.desc ?? ruleId })
        }
      })
    }
  }

  return { ...result, ruleErrors }
}

export type {
  Valuesets,
  SigningKeys,
  RuleSet,
  DCCData,
  ValueSetsComputed,
  VaccinationGroup,
  TestGroup,
  RecoveryGroup,
  VerificationResult,
  CERT_TYPE,
  CertificateContent,
}

export {
  decodeAndValidateRules,
  decodeOnly,
  buildValuesetsComputed,
  loadDCCConfigData,
}
