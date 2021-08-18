import { evaluate } from 'certlogic-js'

import {
  Rule,
  RuleEvaluationDataContext,
  RuleEvaluationResult,
  RuleSet,
  RuleSetEvaluationResult,
} from './types'

export const runRule = (
  rule: Rule,
  data: RuleEvaluationDataContext
): RuleEvaluationResult => {
  try {
    const evalResult = evaluate(rule.Logic, data)

    if (typeof evalResult === 'boolean') {
      return evalResult
    }

    return new Error(
      `rule evaluated to a non-boolean: ${JSON.stringify(evalResult)}`
    )
  } catch (e) {
    return new Error(`rule evaluation errored out: ${e.message}`)
  }
}

export const runRuleSet = (
  ruleSet: RuleSet,
  data: RuleEvaluationDataContext
): RuleSetEvaluationResult => {
  const ruleEvaluations: { [ruleId: string]: RuleEvaluationResult } = {}

  ruleSet.forEach(rule => {
    ruleEvaluations[rule.Identifier] = runRule(rule, data)
  })

  const hasErrors = Object.values(ruleEvaluations).some(
    ruleResult => typeof ruleResult !== 'boolean'
  )

  const allSatisfied =
    !hasErrors &&
    Object.values(ruleEvaluations)
      .map(ruleResult => ruleResult as boolean)
      .reduce((l, r) => l && r)

  return {
    ruleEvaluations,
    hasErrors,
    allSatisfied,
  }
}
