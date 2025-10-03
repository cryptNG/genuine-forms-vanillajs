# \<genuine-captcha> VanillaJS Web Components

![Version](https://img.shields.io/badge/version-1.0.2-blue.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

<genuine-captcha> Genuine Captcha is a privacy-first, open-source CAPTCHA API that lets you verify humans without logging IPs, cookies or personal data — fully GDPR-compliant by design. This repo provides html5 web component for easy usage of genuine captcha 

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
  - [<genuine-captcha> Element](#genuine-captcha-element)
  - [<genuine-captcha> Chat Box](#genuine-captcha-chat-box)
- [Configuration](#configuration)
- [Examples](#examples)
- [Support](#support)

## Installation vanilla js components

Simply include the <genuine-captcha> web component in your HTML file. Add the following script tag as the first element inside the `<body>` tag:

```html
<body>
    <script src="https://cryptng.github.io/genuine-captcha-vanillajs/genuine-captcha.js" crossorigin="anonymous"></script>
    <!-- Your content goes here -->
</body>
```

## Installation npm

Install the <genuine-captcha> web component in your project:

```bash
npm install @genuine-captcha/web-components
```

You might, depending on your bundler, have to use the package somewhere to make it available in your project. For example in emberjsjust add the import statement to the app.js file 

```js
import {GenuineCaptcha} from '@genuine-captcha/web-components';
```

## Usage

### <genuine-captcha> Element

To use the `<genuine-captcha>` component, wrap for example your form send button within the `<genuine-captcha>` element. Like:

```html
<form action="https://genuine-forms.io/s/{form_id}" method="post">
  <label for="email">Your Email</label>
  <input name="Email" id="email" type="email">
  <genuine-captcha>
    <button type="submit">Submit</button>  
   </genuine-captcha>
</form>
```

The default backend api will provide captchas valid for 5 minutes. The component will reset/autoreload a new captcha after the 5 minutes passed.

## Configuration

- `api-url`: [Optional] Your own genuine captcha rpc url.
- `api-key`: [Optional] Your unique API key for accessing extended services.
- `options`: A JSON object with configuration settings. 

## Interaction

The <genuine-captcha> component provides easy usable interaction hooks. They are expected to reside as top level functions in the window object. You can use them for custom handling of verification success and captcha resets.
```js  
window.genuineCaptchaHandleVerify=(solution, secret) =>{
    console.log("CAPTCHA verified:", solution, secret);
}

window.genuineCaptchaHandleReset=() =>{
    console.log("CAPTCHA resetted");
}
```

## Support

For support, issues, or contributions, please visit the [GitHub repository](https://github.com/cryptNG/genuine-captcha-vanillajs).