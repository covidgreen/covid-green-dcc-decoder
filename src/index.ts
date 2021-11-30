import { ValueSetsComputed, RuleSet } from './rules-runner/types'
import decodeQR from './verifier'
import { runRuleSet } from './rules-runner'
import {
  DCCData,
  VerificationResult,
  SigningKeys,
  Valuesets,
  VaccinationGroup,
  TestGroup,
  RecoveryGroup,
  RuleError,
} from './types'
import { getDCCData, populateCertValues } from './util'
import { CERT_TYPE, CertificateContent } from './types/hcert'

const findMostRecent = (results: VerificationResult[]): VerificationResult => {
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

  return latestV || latestR || latestT || results[0]
}

const decodeOnly = async (inputs: {
  source: string[]
  dccData: DCCData
}): Promise<VerificationResult> => {
  const dcc = inputs.dccData
  if (!(dcc && dcc.signingKeys)) {
    throw new Error('You must provide keys')
  }
  if (!(dcc && dcc.valueSets)) {
    throw new Error('You must provide value sets')
  }

  const results: VerificationResult[] = []

  for (const source of inputs.source) {
    const result = await decodeQR(source, dcc.signingKeys)

    if (result.rawCert) {
      result.cert = populateCertValues(
        result.rawCert,
        result.type,
        dcc.valueSets
      )
    }

    results.push(result)
  }
  return findMostRecent(results)
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
  source: string[]
  ruleCountry: string
  ruleLang?: string | 'en'
  dccData: DCCData
  validationClock?: string
}): Promise<VerificationResult> => {
  const result = await decodeOnly(inputs)

  if (!result || result.error) {
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
  CertificateContent,
}

export { CERT_TYPE }

export {
  decodeAndValidateRules,
  decodeOnly,
  buildValuesetsComputed,
  loadDCCConfigData,
}
