export const vaccineCodes: Record<
  string,
  {
    name: string
    ma: string
    mp: string
    vp: string
  }
> = {
  207: {
    name: 'Moderna',
    ma: 'ORG-100031184',
    mp: 'EU/1/20/1507',
    vp: '1119349007',
  },
  208: {
    name: 'Pfizer',
    ma: 'ORG-100030215',
    mp: '',
    vp: '',
  },
  210: {
    name: 'AstraZeneca',
    ma: 'ORG-100001699',
    mp: 'Covishield',
    vp: '1119349007',
  },
  212: {
    name: 'Janssen',
    ma: 'ORG-100001417',
    mp: 'EU/1/20/1525',
    vp: '1119349007',
  },
}
