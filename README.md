<img alttext="COVID Green Logo" src="https://raw.githubusercontent.com/lfph/artwork/master/projects/covidgreen/stacked/color/covidgreen-stacked-color.png" width="300" />

# Digital Covid Ceritifcate Decoder

A node module for decoding DCC certs, validaiong signature and optionally running country specific business rules

For more on DCC see:
- https://github.com/ehn-dcc-development
- https://github.com/eu-digital-green-certificates

## Contents

- [Getting Started](#getting-started)
- [Usage](#usage)
- [Methods](#methods)
- [Team](#team)
- [License](#license)

## Getting started

To install this module

```
# with npm
npm install --save dcc-decoder
```

## Usage

This module supports decoding DCC data either from the QR data, extracting from an image(png only) or extracting from a PDF.
The module can directly load and utilise the trust list from a url provided or you can pass in the trust list, valuesets and business rules.

The response will contain the raw cert (rawCert), the populated cert (cert) using the valudset provided, an errors array that will contain any errors encountered during decoding such as invalid signatire, cert expired etc

#### Example

```javascript
import { decodeOnly, loadDCCConfigData } from 'dcc-decoder';

(async () => {
  await loadDCCConfigData('https://url_for_config')
  const result = await decodeOnly({
          source: { qrData: 'HC1:....' }
        })
  if (result.errors) {
    console.log('Decoding error', result.errors)
  }
  console.log(result.cert)
})()
```

#### Methods

##### `loadDCCConfigData()`

```javascript
const canSupport = await loadDCCConfigData('https://url_for_config')
```

Used to load the dcc config data needed to decode and validate a DCC. Returns the config but also caches it internally in the module.

---

##### `decodeOnly()`

```javascript
const result = await decodeOnly({source: {qrData: 'HC1:....'}});
```

Decodes a DCC qr code. Will accept inoput as string, image or pdf. Returns a promise which includes the raw cert data, populated cert, cert type and any error.

---

##### `decodeAndValidateRules()`

```javascript
const result = await decodeAndValidateRules({source: {qrData: 'HC1:....'}, ruleCountry: 'IE'});
```

Decodes a DCC qr code an then runs the provided business rules against the DCC data. Will accept inoput as string, image or pdf. Returns a promise which includes the raw cert data, populated cert, cert type and any error.

---

## Team

### Lead Maintainers

* @colmharte - Colm Harte <colm.harte@nearform.com>

### Core Team

* @colmharte - Colm Harte <colm.harte@nearform.com>
* @salmanm - Salman Mitha <salman.mitha@nearform.com>

### Contributors
* TBD

### Past Contributors
* TBD

## Hosted By

<img alttext="Linux Foundation Public Health Logo" src="https://www.lfph.io/wp-content/themes/cncf-theme/images/lfph/faces-w_2000.png" width="100">

[Linux Foundation Public Health](https://lfph.io)

## Acknowledgements

<a href="https://nearform.com"><img alttext="NearForm Logo" src="https://openjsf.org/wp-content/uploads/sites/84/2019/04/nearform.png" width="400" /></a>

## License

Copyright (c) 2021 Department of Justice Ireland
Copyright (c) The COVID Green Contributors

[Licensed](LICENSE) under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
