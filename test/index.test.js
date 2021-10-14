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
const RSA_SIGNED =
  'HC1:NCFK60DG0/3WUWGSLKH47GO0:S4KQDITFAUO9CK-500XK0JCV496F3RAM%QU2F311U:RUY50.FK6ZK7:EDOLOPCO8F6%E3.DA%EOPC1G72A6YM88G7:W6Q46X47HA7TM8TL6SG8IS8M*8S46S46307UPC0JCZ69FVCPD0LVC6JD846Y96C463W5307+EDG8F3I80/D6$CBECSUER:C2$NS346$C2%E9VC- CSUE145GB8JA5B$D% D3IA4W5646646-96:96.JCP9EJY8L/5M/5546.96SF63KC.SC4KCD3DX47B46IL6646H*6Z/ER2DD46JH8946JPCT3E5JDLA7$Q69464W51S6..DX%DZJC3/D9Z95LEZED0ECI3D5.CNWE6VCXKEW.C9WEMY9GIA1C9:B8I3D8WE2OA3ZAGY8$PC5$CUZC$$5Y$5FBBN10U$1ZA0P-MG+M5-VUYPLWT%$77L5B%HJG3DBGV47X*F4ST0HO1JJFFRC+6XUM/.H23S2XRQ%6C45IWG9DP1SPAWJXX1TIBA3PNJ35$1%9G9YMDAWN48984+O7XC7SIRNRNR.TH/345SF0P+3JQC7ZVQY*7IZ6-WHZMM1%Q5 U9IB-AT-A1 4JFY9Q90-7N1RPKF725ONF2Q9L0V9XWS/%AOIL5U6D*QB$G0SQ%K53UV-IS.FIF8I$0VUAJLAISN6JKAM9E33O:5ACIP1UURQV9T0CLKUUC.$CD3EWGIDF7EDKUQ9Q0I.4O$ZGH1J6KPFWM8R7AJA$VBM8A67WBS1+65.I4ONUU3RVUHZOJR0EJ$K-J6N$A/WJQ+RK$5LIK :Q6RAA1'

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
        source: [VACCINE_CERT_1_OF_2],
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

    it('Decode from a test rat cert and validate rules', async () => {
      const result = await decodeAndValidateRules({
        source: [TEST_RAT_CERT],
        dccData: dccDataSet,
        ruleCountry: 'IE',
      })

      expect(result.cert).toBeDefined()
      expect(result.rawCert).toBeDefined()
      expect(result.type).toEqual('t')
      expect(result.error).toBeUndefined()
      expect(result.ruleErrors.length).toEqual(1)
      expect(result.cert.nam.gnt).toEqual('JANE')
      expect(result.cert.t[0].tg).toEqual('COVID-19')
      expect(result.rawCert.t[0].tg).toEqual('840539006')
    })

    it('Decode from a test nat cert', async () => {
      const result = await decodeOnly({
        source: [TEST_NAT_CERT],
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
        source: [RECOVERY_CERT],
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

    it('Decode from an RSA signed cert', async () => {
      const result = await decodeOnly({
        source: [RSA_SIGNED],
        dccData: dccDataSet,
      })
      expect(result.cert).toBeDefined()
      expect(result.rawCert).toBeDefined()
      expect(result.type).toEqual('v')
      expect(result.error).toBeUndefined()
      expect(result.ruleErrors).toBeUndefined()

      expect(result.cert.nam.gnt).toEqual('STUDER')
      expect(result.cert.v[0].tg).toEqual('COVID-19')
      expect(result.rawCert.v[0].tg).toEqual('840539006')
    })

    it('Decode with 2 certs provided and ensure lates returned', async () => {
      const result = await decodeOnly({
        source: [
          'HC1:NCFMX1B-N*I0000HHUKXR3G6U12RYKYUOV/9NTFOVN6X9SY7N+DWH95F5L63*TNODRR.7C*J9AHRMG$131T4%RN9DO/UDEL8+LUS79$GGIEA:7O JSMNMO1C2N4-USOMNA1F :6D:51CJFTH*HA2:IU-0G8H.R0+MVW OF-UPFDX8T%U11/LUII/KA- AO.O-%1YZJ29QI70G24PRK6625HGYW8A2521TM69.ANU9A7GH$Y5/L4D24BN0I44+V0KWMN492IQA*J4LT3MPE*90MSKOM MKKHM$Q28+G H1H33BXRPR2WFDD*8TV1CXGYBK/8DJHBMB3YOE*20I-6+H7Q32F8G5AG*Y673R44QH$2IBBP A ERCJDP2HKVVBV2KVQB C%YBOKF:Y6MGQD-2U.KI K2-9:OP8IM3NANTL12SBLS9/6WMDCYR5%8YO4T.VRA7PQRQ/DP-K5JB3EMNQ2SGNQTHS-UBV7W$1.XC 5ORTNI$1CSF6$7UCQ-HD*MFDXU0:1SH2POEZ4G8FW%A5E3',
          'HC1:NCFMX1EM7YUO000F8CF.OHCAH%JNW0/HRGQ9J8VLFLR+70 9X9D+D4F9U1I6TC9TQF0-2CEAZE1HTHH+1-W88$R7OH.N2RU3FT87IE3549SHVPH31GVCVCCKJAE8L0/9RVXRI6UB.IG/AH9AHLQ7KD8KG/*9V+0IHPI2F REBPE8547-N.QL-N7P 8N24AO9WMMNDKUY9A668MI7DOZZ0M5A/QUJ95GUMDMH%FLXAV%OL1T3EIJ+20VQ758F-TK%%FU6S7LINOEL6IB$FRXJP791%DVI1T%EPWN/.CA31Y6CISC9+AVMTFP2$92%F8$DCVDRAC5 *TDQ1NB0Z34MK3D-0 8H424I44+ON0X3LL21+05$30.P9.DT$9LXAPLBW1M$XP P2QVRY*8ML69-COTH:E5UFD38P2 8IYPY4LFLBDBL 8EY9JYK559KX2BP8NNMEVWQ329C8SH4A*0W+RDAEFQ:1R5GKLMI4VUBPI*ESWQH:RXPE01OZKLWRA.CFOJU.2VCQV6 3 041ASN03 VF',
        ],
        dccData: dccDataSet,
      })
      expect(result.cert).toBeDefined()
      expect(result.rawCert).toBeDefined()
      expect(result.type).toEqual('v')
      expect(result.error).toBeUndefined()
      expect(result.ruleErrors).toBeUndefined()

      expect(result.cert.nam.gnt).toEqual('MICHAEL')
      expect(result.cert.v[0].tg).toEqual('COVID-19')
      expect(result.rawCert.v[0].tg).toEqual('840539006')
      expect(result.rawCert.v[0].sd).toEqual(2)
      expect(result.rawCert.v[0].dn).toEqual(2)
    })

    it('Decode with 2 certs provided and ensure vaccine returns rather than recovery', async () => {
      const result = await decodeOnly({
        source: [VACCINE_CERT_1_OF_2, RECOVERY_CERT],
        dccData: dccDataSet,
      })
      expect(result.cert).toBeDefined()
      expect(result.rawCert).toBeDefined()
      expect(result.type).toEqual('v')
      expect(result.error).toBeUndefined()
      expect(result.ruleErrors).toBeUndefined()

      expect(result.cert.nam.gnt).toEqual('FRED')
      expect(result.cert.v).toBeDefined()
    })

    it('Decode with 0 certs provided', async () => {
      const result = await decodeOnly({
        source: [],
        dccData: dccDataSet,
      })
      expect(result).toBeUndefined()
    })

    it('Decode and validate with 0 certs provided', async () => {
      const result = await decodeAndValidateRules({
        source: [],
        dccData: dccDataSet,
      })
      expect(result).toBeUndefined()
    })

    it('Decode from a vaccine cert but provide no keys', async () => {
      await expect(
        decodeOnly({
          source: [VACCINE_CERT_1_OF_2],
          dccData: { valueSets: dccDataSet.valueSets },
        })
      ).rejects.toThrowError()
    })

    it('Decode from a vaccine cert but provide no valuesets', async () => {
      await expect(
        decodeOnly({
          source: [VACCINE_CERT_1_OF_2],
          dccData: { signingKeys: dccDataSet.signingKeys },
        })
      ).rejects.toThrowError()
    })

    it('Decode from a vaccine cert but no signing key', async () => {
      const result = await decodeOnly(
        {
          source: [VACCINE_CERT_1_OF_2],
          dccData: { signingKeys: [], valueSets: dccDataSet.valueSets },
        },
        true
      )

      expect(result.cert).toBeDefined()
      expect(result.rawCert).toBeDefined()
      expect(result.type).toEqual('v')
      expect(result.error).toBeDefined()
    })

    it('Decode a recovery cert, should be no errors', async () => {
      const result = await decodeAndValidateRules({
        source: [RECOVERY_CERT],
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
        source: [VACCINE_CERT_1_OF_2],
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
        source: [VACCINE_CERT_1_OF_2],
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
