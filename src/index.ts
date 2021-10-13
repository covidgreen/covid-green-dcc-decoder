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

const decodeOnly = async (inputs: {
  source: string
  dccData: DCCData
}): Promise<VerificationResult> => {
  const dcc = inputs.dccData
  if (!(dcc && dcc.signingKeys)) {
    throw new Error('You must provide keys')
  }
  if (!(dcc && dcc.valueSets)) {
    throw new Error('You must provide value sets')
  }

  const result = await decodeQR(inputs.source, dcc.signingKeys)

  if (result.rawCert) {
    result.cert = populateCertValues(result.rawCert, result.type, dcc.valueSets)
  }

  return result
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
  source: string
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
