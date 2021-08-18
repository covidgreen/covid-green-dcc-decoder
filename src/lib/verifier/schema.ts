export default {
  type: 'object',
  required: true,
  properties: {
    ver: { type: 'string' },
    dob: { type: 'string', required: true },
    nam: {
      type: 'object',
      required: true,
      properties: {
        fn: { type: 'string', required: true },
        gn: { type: 'string', required: true },
        fnt: { type: 'string', required: true },
        gnt: { type: 'string', required: true },
      },
    },
    v: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tg: { type: 'string', required: true },
          vp: { type: 'string', required: true },
          mp: { type: 'string', required: true },
          ma: { type: 'string', required: true },
          dn: { type: 'integer', required: true },
          sd: { type: 'integer', required: true },
          dt: { type: 'string', required: true, format: 'date' },
          co: { type: 'string', required: true },
          is: { type: 'string', required: true },
          ci: { type: 'string', required: true },
        },
      },
    },
    t: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tg: { type: 'string', required: true },
          tt: { type: 'string', required: true },
          sc: { type: 'string', required: true, format: 'date-time' },
          tr: { type: 'string', required: true },
          co: { type: 'string', required: true },
          is: { type: 'string', required: true },
          ci: { type: 'string', required: true },
        },
      },
    },
    r: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tg: { type: 'string', required: true },
          fr: { type: 'string', required: true, format: 'date' },
          co: { type: 'string', required: true },
          is: { type: 'string', required: true },
          df: { type: 'string', required: true, format: 'date' },
          du: { type: 'string', required: true, format: 'date' },
          ci: { type: 'string', required: true },
        },
      },
    },
  },
}
