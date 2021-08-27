import { RuleSet, ValueSetsComputed } from '../rules-runner/types'

import { CertificateContent, CERT_TYPE } from './hcert'

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

export type DCCData = {
  signingKeys: SigningKeys
  valueSets?: Valuesets
  ruleSet?: RuleSet
  valuesetsComputed?: ValueSetsComputed
}

export type VerificationResult = {
  rawCert?: CertificateContent
  cert?: CertificateContent
  ruleErrors?: string[]
  type?: CERT_TYPE
  error?: Error
}

export type InputSource = {
  qrData?: string
  image?: Buffer
  pdf?: Buffer
}
