import { ValueSetsComputed, RuleSet } from './lib/rules-runner/types'
import decodeQR from './lib/verifier'
import { CertificateContent } from './types/hcert'
import { runRuleSet } from './lib/rules-runner'
import { Options, VerificationResult, SigningKeys, Valuesets } from './types'

const getValuesetsComputed = (valuesets): ValueSetsComputed => {
  return Object.keys(valuesets).reduce((acc, key) => {
    acc[valuesets[key].valueSetId] = Object.keys(valuesets[key].valueSetValues)

    return acc
  }, {})
}

const decodeAndValidateRules = async (
  qrData: string,
  options: Options
): Promise<VerificationResult> => {
  if (!options.signingKeys) {
    throw new Error('You must provide keys')
  }
  if (!options.valueSets) {
    throw new Error('You must provide value sets')
  }

  const { cert, error } = await decodeQR(qrData, options.signingKeys)

  if (error) {
    throw error
  }

  const ruleErrors = []
  const ruleset = options.ruleSet && options.ruleSet[options.ruleCountry]

  if (ruleset) {
    const valuesetsComputed: ValueSetsComputed = getValuesetsComputed(
      options.valueSets
    )

    try {
      const results = runRuleSet(ruleset, {
        payload: cert,
        external: {
          valueSets: valuesetsComputed,
          validationClock: new Date().toISOString(),
        },
      })
      console.log('RESULTS:', results)

      if (results && !results.allSatisfied) {
        Object.keys(results?.ruleEvaluations || {}).forEach(ruleId => {
          const ruleResult = results?.ruleEvaluations[ruleId]
          const rule = ruleset.find(r => r.Identifier === ruleId)

          if (ruleResult === false || ruleResult instanceof Error) {
            const desc =
              rule?.Description?.find(d => d.lang === options.ruleLang) ??
              rule?.Description?.find(d => d.lang === 'en')
            ruleErrors.push(desc?.desc ?? ruleId)
          }
        })
      }
    } catch (err) {
      console.log(err)
      throw err
    }
  }

  return { cert, ruleErrors }
}

const decodeOnly = async (
  qrData: string,
  options: Options
): Promise<CertificateContent> => {
  if (!options.signingKeys) {
    throw new Error('You must provide keys')
  }
  const { cert, error } = await decodeQR(qrData, options.signingKeys)

  if (error) {
    throw error
  }

  return cert
}

export type { Valuesets, SigningKeys, RuleSet, Options }

export { decodeAndValidateRules, decodeOnly }
