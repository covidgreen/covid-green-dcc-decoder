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
} from './types'
import { getDCCData, populateCertValues } from './util'
import { extractQRFromImage, extractQRFromPDF } from './decode'

let loadedDataSet: DCCData

const findQRData = async (source: InputSource): Promise<string> => {
  let qrSource = source.qrData
  if (source.image) {
    qrSource = await extractQRFromImage(source.image)
  } else if (source.pdf) {
    qrSource = await extractQRFromPDF(source.pdf)
  }

  return qrSource
}

const decodeOnly = async (inputs: {
  source: InputSource
  dccData?: DCCData
}): Promise<VerificationResult> => {
  const dcc = inputs.dccData || loadedDataSet
  if (!(dcc && dcc.signingKeys)) {
    throw new Error('You must provide keys')
  }
  if (!(dcc && dcc.valueSets)) {
    throw new Error('You must provide value sets')
  }

  const qrSource = await findQRData(inputs.source)

  const result = await decodeQR(qrSource, dcc.signingKeys)

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
  loadedDataSet = await getDCCData(url)
  return loadedDataSet
}

const decodeAndValidateRules = async (inputs: {
  source: InputSource
  ruleCountry: string
  ruleLang?: string | 'en'
  dccData?: DCCData
}): Promise<VerificationResult> => {
  const result = await decodeOnly(inputs)

  if (result.error) {
    return result
  }

  const dcc = inputs.dccData || loadedDataSet

  const ruleErrors = []
  const ruleset = dcc.ruleSet && dcc.ruleSet[inputs.ruleCountry]

  if (ruleset) {
    const results = runRuleSet(ruleset, {
      payload: result.rawCert,
      external: {
        valueSets: dcc.valuesetsComputed || loadedDataSet.valuesetsComputed,
        validationClock: new Date().toISOString(),
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
}

export {
  decodeAndValidateRules,
  decodeOnly,
  buildValuesetsComputed,
  loadDCCConfigData,
}
