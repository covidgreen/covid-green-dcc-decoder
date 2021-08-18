import format from 'date-fns/format'
import fetch from 'node-fetch'

import { Options, SigningKeys, Valuesets } from '../types'

import { RuleSet } from './rules-runner/types'

export function now() {
  return new Date()
}

export function formatDate(d: number | string | Date): string {
  if (!d) return null

  return format(new Date(d), 'dd-MMM-yyyy')
}

export function formatDateTime(d: number | string | Date): string {
  if (!d) return null

  return format(new Date(d), 'dd-MMM-yyyy hh:mm:ss aa')
}

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

export async function getDCCData(url: string): Promise<Options> {
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
      valueSets: body.valueSets as Valuesets,
      ruleSet: body.rules as RuleSet,
    }
  }

  const data = resp.json ? await resp.json() : 'Unable to request data'

  throw new Error(data)
}
