import fs from 'fs'
import path from 'path'

import fetch from 'node-fetch'

import {
  decodeOnly,
  decodeAndValidateRules,
  buildValuesetsComputed,
  loadDCCConfigData,
} from '../src/index'

import * as dccConfig from './certdata.json'

jest.mock('node-fetch', () => jest.fn())

const VACCINE_CERT_1_OF_2 =
  'HC1:NCFOXN%TS3DH$QGO9C6%O +1P3HA.QRT8SFBXG42GLA:E:X9TLS9HLKQC%8LCV4*XUA2PSGH.+HIMIBRU SITK292W7*RBT1ON1XVHWVHE 9HOP+MMBT16Y51Y9AT1 %P6IAXPMMCGCNNM3LS.8YE9/MVEK0WLI+J53O8J.V J8$XJ3:UWS14Y7Z:UBRIFX9JS5SX1MU9WW5.OQO$HTM2A.P2WQ J2TM20R57 9%%PRWOZIEQKERQ8IY1I$HH%U8 9PS5OH6SRISLGFTIPPAAMI PQVW55Q1DHB R1:PI/E2$4J6ALD-I E70KV:SNO05J1TGE7Z+SP5LQ05KCTTZK$E7DIN /KF-KRZ4N*KV7J$%25I3KC31835AL5:4A93/IBIFT+EJEG34S8N%TPORNFV3HR1UMSZ4KI9ZSH9WRF4W5IM17T4Q1 :IP0J-2VJ8JEE5DZV7Y9OJ84NVA6SXVHU3O1:58MT8UGD:GEG0I5WAQSU/NY-Q-0KL4E'
const TEST_NAT_CERT =
  'HC1:NCFOXN%TS3DH$PC1JP58UN3VIR3CIDAG4%%5OGIV%Q/O7M*4$AEWS6AD64ZQ NI4EFSYSC%OW4PUE9.IP6MIVZ0K1HI 0VON/%8CY0H-AIZKA6C3S4SH99H6-F0+V9.T9D 9BTUXP6.O35V2QJA-O9AJ9SRISLGNTICZU6/GZW4Z*AK.GNNVR*G0C7 QTX63*SFTTTBM3+BBXSJ+LJX8LEG3SP4/IBMD3:YKPG3/EB76B0FBQHBQNB*3H3ZCHSG845RBQ746B46O1N646RM9XC5.Q69L6-96QW6U46Q3QR$P2OIC0JVPI5.S.EU6*3DZI69JAZI28KA/B:ZJ83BZUS/JTHOJ92K0TS3DJ6NJF0JEYI1DLZZLUCI5OI9YI:8D%BCS7VAD99P8R1FTMPFGWS MFCRUMN/75AXOWRM3HQ:CLV:SS1LSPMVJ3T*N7AUYPMM/JN5TYTOK FV8JZUOM*IN6DP JA4QJPTKMJQIK$1P39OR40GC8:2'
const TEST_RAT_CERT =
  'HC1:NCFOXN%TS3DH$PC1JP58UN3VIR3CIDTH4O:5OGIV%Q/O7M*4$AEI*QAD64ZQ NI4EFSYSC%OW4PUE9.IP6MIVZ0K1HI 0VON/%8CY0H-AIZKA6C3S4/IEKMAB+HH+HSH9HPMME0$R1/T1QX5I+HAJ9SRISLGNTICZU2*8ZW4Z*AK.GNNVR*G0C7 QTX63*SF3RT*/403L+*4TLJ.FJXEBHP4WD34V4YD3F1LKD3KJ3X2LR*41MJ$3H3ZCHSG845RBQ746B46O1N646RM9XC5.Q69L6-96QW6U46Q3QR$P2OIC0JVPI5.S.EU6*3DZI69JAZI28KA/B:ZJ83BZUS/JTHOJ92K0TS3DJ6NJF0JEYI1DLZZLUCI5OI3WINXEBX0:K6172ODU481B5BQB1KPIMK4D25 US$.ONUA-.9V/VYXR+4B: 4:YMQMBQ/TLYSL9ULBQN.0KQMB*4MTUFYF:5VASH:MK1TI2+SPXS325S8IHB0UOS4/E'
const RECOVERY_CERT =
  'HC1:NCFOXN%TS3DH.YS2P4DXOUZ97J3A.QXV8VWBXG42GLA:E:X9TLSSDDKQC%8LCV4*XUA2P-FHT-H4SI/J9WVHWVH+ZE-R54W1$NICZUBOM*LPKW2GHKW/F3IKJ5QGRV*2HW2KVVVH85 LPJ2HI 0//CD4T9%2+-C90LX:C.*46*8GHHF/8G0HT*2E70ZJJ6JP$LO5B9-NT0 2$$0X4PCY0+-C*DD 9A /P3W14SITTQ$R7FVI*%NH$R KP8EF3EDG/7B9UQJO1FD3ED E7VPT80P9NTIV4-.BU0GLF9CEF .B5HFWKP/HLIJLKNF8JFHJP7NVDEB$/I*Z2BN65S9AR35/UBK6QTSR21/.7F13C5C98U*:4.OVCCD2$I6961W6PM09FPK.E$6GJXD8%9HZUVO8 U5L2ULUOYXMS$U5K2U9KH-FCS2UM61RHTY1OK5AFD'

describe('Validating QR Codes', () => {
  let dccDataSet

  beforeAll(async () => {
    dccDataSet = {
      signingKeys: dccConfig.certs,
      ruleSet: dccConfig.rules,
      valueSets: {
        countryCodes: dccConfig.valueSets.countryCodes.valueSetValues,
        diseaseAgentTargeted:
          dccConfig.valueSets.diseaseAgentTargeted.valueSetValues,
        testManf: dccConfig.valueSets.testManf.valueSetValues,
        testResult: dccConfig.valueSets.testResult.valueSetValues,
        testType: dccConfig.valueSets.testType.valueSetValues,
        vaccineMahManf: dccConfig.valueSets.vaccineMahManf.valueSetValues,
        vaccineMedicinalProduct:
          dccConfig.valueSets.vaccineMedicinalProduct.valueSetValues,
        vaccineProphylaxis:
          dccConfig.valueSets.vaccineProphylaxis.valueSetValues,
      },
      valuesetsComputed: buildValuesetsComputed(dccConfig.valueSets),
    }
  })

  describe('Decode from qr data', () => {
    it('Decode from a vaccine cert ', async () => {
      const result = await decodeOnly({
        source: { qrData: VACCINE_CERT_1_OF_2 },
        dccData: dccDataSet,
      })

      expect(result.cert).toBeDefined()
      expect(result.rawCert).toBeDefined()
      expect(result.type).toEqual('v')
      expect(result.error).toBeUndefined()
      expect(result.ruleErrors).toBeUndefined()
      expect(result.debugData).toBeUndefined()
      expect(result.cert.nam.gnt).toEqual('JANE')
      expect(result.cert.v[0].tg).toEqual('COVID-19')
      expect(result.rawCert.v[0].tg).toEqual('840539006')
    })

    it('Decode from a test nat cert', async () => {
      const result = await decodeOnly({
        source: { qrData: TEST_NAT_CERT },
        dccData: dccDataSet,
      })
      expect(result.cert).toBeDefined()
      expect(result.rawCert).toBeDefined()
      expect(result.type).toEqual('t')
      expect(result.error).toBeUndefined()
      expect(result.ruleErrors).toBeUndefined()

      expect(result.cert.nam.gnt).toEqual('JANE')
      expect(result.cert.t[0].tg).toEqual('COVID-19')
      expect(result.rawCert.t[0].tg).toEqual('840539006')
    })

    it('Decode from a recovery cert', async () => {
      const result = await decodeOnly({
        source: { qrData: RECOVERY_CERT },
        dccData: dccDataSet,
      })
      expect(result.cert).toBeDefined()
      expect(result.rawCert).toBeDefined()
      expect(result.type).toEqual('r')
      expect(result.error).toBeUndefined()
      expect(result.ruleErrors).toBeUndefined()

      expect(result.cert.nam.gnt).toEqual('JANE')
      expect(result.cert.r[0].tg).toEqual('COVID-19')
      expect(result.rawCert.r[0].tg).toEqual('840539006')
    })

    it('Decode from a vaccine cert and return debug data', async () => {
      const result = await decodeOnly(
        {
          source: { qrData: VACCINE_CERT_1_OF_2 },
          dccData: dccDataSet,
        },
        true
      )

      expect(result.cert).toBeDefined()
      expect(result.rawCert).toBeDefined()
      expect(result.type).toEqual('v')
      expect(result.error).toBeUndefined()
      expect(result.ruleErrors).toBeUndefined()
      expect(result.debugData).toBeDefined()
      expect(result.cert.nam.gnt).toEqual('JANE')
      expect(result.cert.v[0].tg).toEqual('COVID-19')
      expect(result.rawCert.v[0].tg).toEqual('840539006')
    })

    it('Decode from a vaccine cert but provide no keys', async () => {
      await expect(
        decodeOnly({
          source: { qrData: VACCINE_CERT_1_OF_2 },
          dccData: { valueSets: dccDataSet.valueSets },
        })
      ).rejects.toThrowError()
    })

    it('Decode from a vaccine cert but provide no valuesets', async () => {
      await expect(
        decodeOnly({
          source: { qrData: VACCINE_CERT_1_OF_2 },
          dccData: { signingKeys: dccDataSet.signingKeys },
        })
      ).rejects.toThrowError()
    })

    it('Decode from a vaccine cert but no signing key', async () => {
      const result = await decodeOnly(
        {
          source: { qrData: VACCINE_CERT_1_OF_2 },
          dccData: { signingKeys: [], valueSets: dccDataSet.valueSets },
        },
        true
      )

      expect(result.cert).toBeDefined()
      expect(result.rawCert).toBeDefined()
      expect(result.type).toEqual('v')
      expect(result.error).toBeDefined()
    })
  })

  describe('Decode a image', () => {
    it('Decode a vaccine cert from an image', async () => {
      const image = fs.readFileSync(
        path.join(__dirname, 'images', 'vaccinecert.png')
      )
      const result = await decodeOnly({
        source: { image },
        dccData: dccDataSet,
      })
      expect(result.cert).toBeDefined()
      expect(result.rawCert).toBeDefined()
      expect(result.type).toEqual('v')
      expect(result.error).toBeUndefined()
      expect(result.ruleErrors).toBeUndefined()
    })

    it('Decode a recovery cert from an image', async () => {
      const image = fs.readFileSync(
        path.join(__dirname, 'images', 'recoverycert.png')
      )
      const result = await decodeOnly({
        source: { image },
        dccData: dccDataSet,
      })
      expect(result.cert).toBeDefined()
      expect(result.rawCert).toBeDefined()
      expect(result.type).toEqual('r')
      expect(result.error).toBeUndefined()
      expect(result.ruleErrors).toBeUndefined()
    })

    it('Decode a cert from an image that has multiple QR codes', async () => {
      const image = fs.readFileSync(
        path.join(__dirname, 'images', 'multiqr.png')
      )

      await expect(
        decodeOnly({ source: { image }, dccData: dccDataSet })
      ).rejects.toThrowError()
    })

    it('Decode a cert from an image but provide an invalid image as input', async () => {
      const image = fs.readFileSync(
        path.join(__dirname, 'images', 'notanimage.pdf')
      )

      await expect(
        decodeOnly({ source: { image }, dccData: dccDataSet })
      ).rejects.toThrowError()
    })

    it('Decode an RSA signed vaccine cert', async () => {
      const image = fs.readFileSync(
        path.join(__dirname, 'images', 'rsasignedvaccinecert.png')
      )
      const result = await decodeOnly({
        source: { image },
        dccData: dccDataSet,
      })
      expect(result.cert).toBeDefined()
      expect(result.rawCert).toBeDefined()
      expect(result.type).toEqual('v')
      expect(result.error).toBeUndefined()
      expect(result.ruleErrors).toBeUndefined()
    })
  })

  describe('Decode a pdf', () => {
    it('Decode a vaccine cert from a pdf', async () => {
      const pdf = fs.readFileSync(
        path.join(__dirname, 'pdfs', 'vaccinecert.pdf')
      )
      const result = await decodeOnly({ source: { pdf }, dccData: dccDataSet })
      expect(result.cert).toBeDefined()
      expect(result.rawCert).toBeDefined()
      expect(result.type).toEqual('v')
      expect(result.error).toBeUndefined()
      expect(result.ruleErrors).toBeUndefined()
    })

    it('Decode a vaccine cert from a pdf butr source is not a pdf', async () => {
      const pdf = fs.readFileSync(path.join(__dirname, 'pdfs', 'notapdf.png'))

      await expect(
        decodeOnly({ source: { pdf }, dccData: dccDataSet })
      ).rejects.toThrowError()
    })
  })

  describe('Decode and validate rules', () => {
    it('Decode a vaccine cert', async () => {
      const result = await decodeAndValidateRules({
        source: { qrData: VACCINE_CERT_1_OF_2 },
        ruleCountry: 'IE',
        dccData: dccDataSet,
      })

      expect(result.cert).toBeDefined()
      expect(result.type).toEqual('v')
      expect(result.error).toBeUndefined()
      expect(result.ruleErrors).toBeDefined()
      expect(result.cert.nam.gnt).toEqual('JANE')
      expect(result.ruleErrors.length).toEqual(1)
    })

    it('Decode a test RAT cert', async () => {
      const result = await decodeAndValidateRules({
        source: { qrData: TEST_RAT_CERT },
        ruleCountry: 'IE',
        dccData: dccDataSet,
      })

      expect(result.cert).toBeDefined()
      expect(result.type).toEqual('t')
      expect(result.error).toBeUndefined()
      expect(result.ruleErrors).toBeDefined()
      expect(result.cert.nam.gnt).toEqual('JANE')
      expect(result.ruleErrors.length).toEqual(1)
    })

    it('Decode a recovery cert, should be no errors', async () => {
      const result = await decodeAndValidateRules({
        source: { qrData: RECOVERY_CERT },
        ruleCountry: 'IE',
        dccData: dccDataSet,
      })

      expect(result.cert).toBeDefined()
      expect(result.type).toEqual('r')
      expect(result.error).toBeUndefined()
      expect(result.ruleErrors).toBeDefined()
      expect(result.cert.nam.gnt).toEqual('JANE')
      expect(result.ruleErrors.length).toEqual(0)
    })

    it('Decode with no rules', async () => {
      const result = await decodeAndValidateRules({
        source: { qrData: VACCINE_CERT_1_OF_2 },
        ruleCountry: 'ZZ',
        dccData: dccDataSet,
      })

      expect(result.cert).toBeDefined()
      expect(result.type).toEqual('v')
      expect(result.error).toBeUndefined()
      expect(result.ruleErrors).toBeDefined()
      expect(result.cert.nam.gnt).toEqual('JANE')
      expect(result.ruleErrors.length).toEqual(0)
    })

    it('Decode with a decode error', async () => {
      const result = await decodeAndValidateRules({
        source: { qrData: VACCINE_CERT_1_OF_2 },
        ruleCountry: 'IE',
        dccData: { signingKeys: [], valueSets: dccDataSet.valueSets },
      })

      expect(result.cert).toBeDefined()
      expect(result.type).toEqual('v')
      expect(result.error).toBeDefined()
      expect(result.ruleErrors).toBeUndefined()
    })
  })

  describe('Load dcc data', () => {
    it('Load dcc data with an invalid url', async () => {
      await expect(loadDCCConfigData('some url')).rejects.toThrowError()
    })

    it('Load dcc data', async () => {
      // eslint-disable-next-line
      const response = Promise.resolve({
        ok: true,
        status: 200,
        json: () => {
          return dccConfig
        },
      })
      fetch.mockImplementation(() => response)

      const data = await loadDCCConfigData('some url')
      expect(data.signingKeys).toBeDefined()
      expect(data.ruleSet).toBeDefined()
    })
  })
})
