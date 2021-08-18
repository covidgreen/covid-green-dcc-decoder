import { RuleSet } from '../lib/rules-runner/types'

import { CertificateContent } from './hcert'

export type Valueset = {
  display: string
  lang: string
  active: boolean
  version: string
  system: string
}

export type Valuesets = {
  countryCodes: Record<string, Valueset>
  diseaseAgentTargeted: Record<string, Valueset>
  testManf: Record<string, Valueset>
  testResult: Record<string, Valueset>
  testType: Record<string, Valueset>
  vaccineMahManf: Record<string, Valueset>
  vaccineMedicinalProduct: Record<string, Valueset>
  vaccineProphylaxis: Record<string, Valueset>
}

export type SigningKey = {
  kid: string
  x: string
  y: string
  country: string
  pem?: string
}

export type SigningKeys = SigningKey[]

export type Options = {
  signingKeys: SigningKeys
  valueSets?: Valuesets
  ruleSet?: RuleSet
  ruleLang?: string
  ruleCountry?: string
}

export type VerificationResult = {
  cert: CertificateContent
  ruleErrors: string[]
}
