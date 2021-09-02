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
  'HC1:6BFOXN%TSMAHN-HXZSMMVQLG34MT9Q$AH$/80RBZEJ0PTM*469DLLOLX82AS$ZR NI4EFSYS1-ST*QGTAAY7.Y7B-S-*O5W41FDWKL%KN2V4LF9CEFE.DFHL KP8EFWKLI4OI84TNP8EFVA5TD87-5ZD5CC9T0H67T5QNG.85$0SGH.+H$NI4L6KXI%UG/YL WO*Z7ON1N+L-$BQO3BT1UEK7+P5IQ-HQ%YQE657Q4UYQD*O%+Q.SQBDOBKLP64-HQ/HQ+DR-DP-3AQ$95:UENEUW6646C46846OR6UF5LDCPK9//0*F7Z6NC8P$WA3AA9EPBDSM+QFE4UX4U96L*K1UPJCLHCRTWA%DPAC5ADNA2PI+MUKM1Q4IZ6QR8508XIORW6%5LKP89TMHW6 96 Y4-GC.WN.+5UET+3SQY27+I1JTG+TWARG6U$1W4.KM+F50Q97WOV2*-HT263TANVVU4CPY87PKQRAPQ0LFV+W7TPLJO2Y3RIV6TMQBUDN00B7V31'
const TEST_NAT_CERT =
  'HC1:6BFOXN%TSMAHN-HXZSMMVQLG34MT9Q$AH$/8VWBZEJ0PTM*469DJRVSRH+/DOJACV4*XUA2P9FH4%HFTIARI.R4HQ1*P1MX12XE-WHON1Y$LL99KCOK59.+IIYC6Q0ZIJPKJ+LJ%2TZ0DPA7AH5LXK$4JK%IR:4-Q00$499TVU1PK9PYLPN1VUU8C1VTEC$QZ76XCV/.QM:6LTM6-6KR6K+9SW6.B9-$M:Q6S89JR6-TM0IMEOM%+M72NI 16PPXY02EA81K0ECM8CXVDC8C90JZJAPEDI.C$JC7KDF9C$ZJ*DJ3Q4+Y5GT4+MPODSCX7B95.16595Y:7K-NSA7G6MA0PQNQJW63X7U-O 96SZ6FT5D75W9AAABE34+V4YC5/HQVNOA%TKQIB:0H$T7DS-47CXMHNM.+R/*D.QV2S7995/7RVJD 1L5F5J*IFBUD 6H RF.SXKI30HMGCZ J/SL.-20CSY$U4DGSM38TGLTN$PL-313H0VF0XGF'
const TEST_RAT_CERT =
  'HC1:6BFOXN%TSMAHN-HXZSMMVQLG34MT9Q$AH$/83:BZEJ0PTM*469DR4TSRH+/DOMECV4*XUA2P9FH4%HFTIARI.R4HQ1*P1MX12XE-WHON1Y$LL99KCOK59.+IJYCDN0TA3RK37MBZD3%2TG+CBC7%55LXK$4JK%IR:4-Q00$499T*%HPK9PYLPN1VUU8C1VTEC$QZ76XCV/.QM:6LTM6-6KR6K+9SW6.B9-$M:Q6S89JR6-TM0IMEOM%+M72NI 16PPXY02EA81K0ECM8CXVDC8C90JZJAPEDI.C$JC7KDF9C$ZJ*DJ3Q4+Y5GT4+MPODSCX7B95.16595Y:7K-NSA7G6MA0PQNQJW63X7U-O 96SZ6FT5D75W9AAABE34+V4M85*GTML1V4H2E4YF25*OHJDO08.14/QC5HNIWQ$IM%39-1G*NJ52WX0O0D8V021UJ6CS5RVFS41SDE.1X$BKZ48:CY-6207O.PRECGEV/UI+TSMW3IOJF504VMM3'
const RECOVERY_CERT =
  'HC1:6BF%RN%TSMAHN-HVUOEJPJ-QNT3BNN1C2.7JC89XW3M TM*4335JXEAD64ZQ NI4EFSYS1-ST*QGTAAY7.Y7B-S-*O5W41FDNILAOV KLLF9$HFCD4-LN1FDBY4I0CU0GJMO9NT/Y4HD4G5OZD5CC9T0HE1JCNNQ7TT0H-FHT-HNTIUZUIS7HRIWQH.UCXGAMF2NI9QRAJG9IVU5P2-GA*PE+E6JT72JA H2XJAWLI+J53O8J.V J8$XJK*L5R1IS7K*LBT19+JIU1$GO P3JKB523KD3423 73DIB8J3OHBPHB%*4WV2Z73423ZQTZABKD3O05C$KFGF35T-B5P54YII*50 X4CZKHKB-43.E3KD3BBJC57.JLY8UF28JAAJGUEO5Z J3BHPCTYY3G:7H.VQ%V9UV/:8U1LZ8KZ2VT6ELPCPZ7.4Q05TOV0AQ5BQGR6E-*3CM7ZDDF4NC.SQVPHZ8000U507EWFDA13'

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
      expect(result.cert.nam.gnt).toEqual('FRED')
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

      expect(result.cert.nam.gnt).toEqual('TOM')
      expect(result.cert.r[0].tg).toEqual('COVID-19')
      expect(result.rawCert.r[0].tg).toEqual('840539006')
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

    /*it('Decode a recovery cert from an image (CH)', async () => {
      const image = fs.readFileSync(
        path.join(__dirname, 'images', 'REC_CH_BAG.png')
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
    })*/

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
      expect(result.cert.nam.gnt).toEqual('FRED')
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
      expect(result.cert.nam.gnt).toEqual('TOM')
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
      expect(result.cert.nam.gnt).toEqual('FRED')
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
