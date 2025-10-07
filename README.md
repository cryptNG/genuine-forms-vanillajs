# Genuine Forms — HTML5 Web Components

**One-stop form handling + transactional email** with built-in, privacy-first human verification (via **Genuine Captcha**). Drop the component into any HTML page—no framework required.

* ✅ Native Custom Elements: `<genuine-form>` and `<genuine-captcha>`
* ✅ Blocks submission until captcha is verified and required fields are valid
* ✅ Works with plain HTML or any framework (React, Vue, Svelte, Astro, …)
* ✅ Zero build-step required (ES module)

---

## Hot Links
- [Developer Early Preview](#developer-early-preview)

## Demo / CDN

* **Production script:**
  `https://cryptng.github.io/genuine-forms-vanillajs/genuine-form.js`

> You can load this URL directly in a `<script type="module">` tag for quick demos or static sites.

---

## Install

### Option A: npm (recommended)

```bash
npm install @genuine-forms/web-components
```

Then import once in your app init script or similar:

```js
// For example for emberjs in app.js
import '@genuine-forms/web-components';
```

### Option B: Script tag (no build tools)

```html
<script type="module" src="https://cryptng.github.io/genuine-forms-vanillajs/genuine-form.js"></script>
```

---

## Quick start (Plain HTML)

```html
<script type="module" src="https://cryptng.github.io/genuine-forms-vanillajs/genuine-form.js"></script>

<genuine-form subject="Neue Projektanfrage" api-key="###">
  <input name="first-name" required /> <br />
  <input name="last-name" required /> <br />
  <input name="email" type="email" required /> <br />
  <textarea name="project" rows="8"></textarea> <br />
  <input name="privacy" type="checkbox" required /> <br />

  <genuine-captcha>
    <button type="submit">Send</button>
  </genuine-captcha>
</genuine-form>
```

**How it works**

* Put your normal HTML inputs inside `<genuine-form>`.
* Wrap your submit button with `<genuine-captcha>…</genuine-captcha>`.
* Submission is only allowed after captcha verification **and** HTML validation (`required`, `type="email"`, etc.) pass.

---

## Component API

### `<genuine-form …>`

**Attributes**

* `subject` *(string)* — Subject line used for the outgoing message.
* `name` *(string, optional)* — For setups using multiple genuine-form on the same page you need to provide unique names.
* `api-key` *(string, optional)* — For setups that require an API key.
* `api-url` *(string, optional)* — For setups that require a custom API endpoint. (If you don’t use a hosted backend, you can ignore or repurpose this.)

**Slot content**

* Standard form controls: `<input>`, `<select>`, `<textarea>`
* One `<genuine-captcha>` wrapper containing a `<button type="submit">…</button>`

**Validation**

* Native HTML5 validation is honored (e.g., `required`, `type="email"`, checked checkboxes, radio groups).

### `<genuine-captcha>`

* Renders & manages the captcha challenge provided by the Genuine Captcha widget script.
* Blocks the parent form’s submission until verified.

> Don’t forget to include the widget:
> `<script src="https://cdn.genuine-captcha.io/widget.js" defer></script>`

---

## Customization hooks (optional)

You can customize validation, payload, and response handling by defining the following global functions before the user submits:

```html
<script>
  // Return boolean. Receives the <genuine-form> element.
  window.genuineFormHandleValidate = (formEl) => {
    // Example: rely on built-in validity + custom logic
    return formEl.checkValidity();
  };

  // Return { subject, body } — both strings.
  window.genuineFormGenerateSubjectAndBody = (formEl, defaultSubject) => {
    const data = Object.fromEntries(
      [...formEl.querySelectorAll('[name]')].map(el => [el.name, el.type === 'checkbox' ? el.checked : el.value])
    );
    return { subject: defaultSubject, body: JSON.stringify(data) };
  };

  // Handle network result. Receives { ok, body?, error? }.
  window.genuineFormHandleSendResponse = (res) => {
    alert(res.ok ? 'Thanks! Your message was sent.' : 'Sorry, something went wrong.');
  };
</script>
```

If you don’t define these, sensible defaults are used.

---

## Backend / Delivery

You have two options:

1. **Use the Genuine Forms hosted backend** (recommended):
   Provide the credentials/keys your deployment requires (e.g., `api-key`) and follow your server’s instructions.

2. **Bring your own backend:**
   Point the component to your API that:

   * verifies the captcha token,
   * sends the email (e.g., SMTP or a mail API),
   * returns a JSON result `{ ok: true }` (or `{ ok: false, error: "…" }`).

> **Security note:** Do not put private secrets in the browser. Keep API secrets on the server.

---

## Framework notes

* **React/Vue/etc.**: Custom Elements work out-of-the-box. Use standard HTML attributes (kebab-case).
* **SSR/Static**: Works on static hosts; the component upgrades on the client.

---

## Accessibility

* Because you use native inputs, standard a11y applies (labels, focus order, contrast).
* Genuine Captcha offers an accessible fallback; ensure it’s enabled in your configuration.

---

## Troubleshooting

* **Captcha doesn’t appear** → Ensure the widget script is included and not blocked by CSP/AdBlock.
* **Submit button does nothing** → Check that it’s inside `<genuine-captcha>` and has `type="submit"`.
* **Validation always fails** → Verify all required fields have a `name` attribute and valid values.
* **CORS/Network errors** → Confirm your backend endpoint, allowed origins, and JSON response shape.

---

## Roadmap

* Configurable endpoint (attribute) and `POST` JSON submission by default
* TypeScript types & unit tests
* Better multi-form pages (scoped listeners)
* First-party React/Vue wrappers (optional)

## Developer Early Preview

The developer early preview lets you try out without any api-key. You have to provide the receiver email address in a "secure" way. Therefore you need to "encrypt" the email in the following way. You can do that in any js console. Don't put the plain secret anywhere in you web project.

```js
function xor_encrypt(key, data) {
  return data.split('').map(function(c, i) {
    return c.charCodeAt(0) ^ key.charCodeAt( Math.floor(i % key.length) );
  });
}

xor_encrypt("sosupersecret","c.greinke@googlemail.com").toString()
```
This will generate '16,65,20,7,21,12,28,24,0,35,21,10,27,20,3,22,24,17,12,30,93,6,12,31'. You can then pass as receiver attribute to the <genuine-form> web component. Don't use the aforementioned string but create your own. If you have difficulty just drop me a message via reddit to https://www.reddit.com/user/love2Bbreath3Dlife/


```html
<genuine-form receiver="+++encrypted-email+++"> 
  <input name="first-name" required /> <br />
  <input name="last-name" required /> <br />
  <input name="email" type="email" required /> <br />
  <textarea name="project" rows="8"></textarea> <br />
  <input name="privacy" type="checkbox" required /> <br />

  <genuine-captcha>
    <button type="submit">Send</button>
  </genuine-captcha>
</genuine-form>
```

---

## License

MIT (unless your repo specifies otherwise)

---

## Changelog

See Git tags/releases for versioned changes once published.
