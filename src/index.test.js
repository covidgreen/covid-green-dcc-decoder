import { getDCCData } from './lib/util'

import { decodeOnly, decodeAndValidateRules } from './index'

const validQRData =
  'HC1:NCFU%BEJM+J2PS37DELTLS/CCMGP35T45 .VLVN0DR $9O+4-TIW.IVP1O3L6DSAR9F2IYO70QFQLGPD8$TILQH457LMG %EOOG1P4095I31GQ2NHEI5W5QQEYB DSRVN 5O+3CJH3EXQFVJZVS8.RP0GB M4S6V+89CCADS/3CPGB22WY*NEM3Y3L/VH%D4BXKP*C9NHN-C*5ANG2K7QJ68KB2:QRRL3 H5J2D96S:/0U-0Q*79NFW6SO-GGBE 1QTC5N+O-FHA7WFO6EVM.JF3K5 WB701FAAU2UC%DYNFFPKQ/8XQRV05MKBCFMTEGB*6F*B6KBX3TT*PU4NU 4KZL%48$ALAZO640IIRM-9FQTN2I1 87F9WI0HSBT885BPELERYJ3+P4XG8MJJ+JWG6SEP:VDAAATK2U+J8JJCNV*POC-D.D4ALPE.1B1EK+KJEW*HP--SJ572MOJFSI00FQ4HFS8OOOWU1V2$VB+92YB6ZTNY*QQSA01U28S53V2ZU**3Q0O5RCS02ZJIZP5H3B4:3V9QDJJGVOE$UORKZN9M6W7.2NXM+UH:9TW-1$.V%$R*0OK TVTNF2C14VT:A1KUGXQ9AKPD0T/1:0'

describe('Validating QR Codes', () => {
  let dccDataSet

  beforeAll(async () => {
    dccDataSet = await getDCCData(process.env.DCC_DATA_URL)
  })

  describe('Decode only checks', () => {
    it('Decode a vaccination cert', async () => {
      const cert = await decodeOnly(validQRData, dccDataSet)

      expect(cert.nam.gnt).toEqual('GREIZINS')
    })
  })

  describe('Decode and validate rules', () => {
    it('Decode a valid cert', async () => {
      const { cert, ruleErrors } = await decodeAndValidateRules(
        validQRData,
        dccDataSet
      )

      expect(cert.nam.gnt).toEqual('GREIZINS')
      expect(ruleErrors.length).toEqual(0)
    })
  })
})
