# Genuine Forms — HTML5 Web Components

**One-stop form handling + transactional email** with built-in, privacy-first human verification (via **Genuine Captcha**). Drop the component into any HTML page—no framework required.

* ✅ Native Custom Elements: `<genuine-form>` and `<genuine-captcha>`
* ✅ Blocks submission until captcha is verified and required fields are valid
* ✅ Works with plain HTML or any framework (React, Vue, Svelte, Astro, …)
* ✅ Zero build-step required (ES module)
* ✅ Event-driven architecture for easy customization
* ✅ Shadow DOM with CSS custom properties for styling

---

## Hot Links
- [Developer Early Preview](#developer-early-preview)
- [Event System](#event-system)
- [Customization Hooks](#customization-hooks-optional)

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

<genuine-form subject="New Project Request" api-key="YOUR_API_KEY" name="contact-form">
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

* `subject` *(string)* — Subject line used for the outgoing email. Default: `'Generic Subject'`
* `name` *(string, optional)* — Unique identifier for the form. Required when using multiple genuine-forms on the same page. Default: `'genuine-form'`
* `api-key` *(string, optional)* — Your Genuine Forms API key for production use.
* `receiver` *(string, optional)* — For [Developer Early Preview](#developer-early-preview) only. XOR-encrypted email address. Falls back to api-key if not set.
* `api-url` *(string, optional)* — Custom API endpoint. Default: `https://genuine-forms.io/api/gf-send-dev`

**Slot content**

* Standard form controls: `<input>`, `<select>`, `<textarea>`
* One `<genuine-captcha>` wrapper containing a `<button type="submit">…</button>`

**Validation**

* Native HTML5 validation is honored:
  - `required` on inputs, textareas, and selects
  - `type="email"` for email validation
  - Required checkboxes must be checked
  - Radio button groups (at least one must be selected)
  - Multi-select dropdowns must have at least one selection

### `<genuine-captcha>`

* Renders & manages the captcha challenge provided by the Genuine Captcha widget.
* Blocks the parent form's submission until verified.
* Automatically imported from `https://cryptng.github.io/genuine-captcha-vanillajs/genuine-captcha.js`

---

## Event System

Access the event system through `window.genuineForms[formName]` where `formName` matches your form's `name` attribute (default: `'genuine-form'`).

```js
// Register event handlers
window.genuineForms['contact-form'].on('send-response', (response) => {
  if (response.ok) {
    console.log('Email sent successfully:', response.body);
  } else {
    console.error('Error:', response.error);
  }
});

window.genuineForms['contact-form'].on('validation-failed', () => {
  alert('Please fill out all required fields.');
});

window.genuineForms['contact-form'].on('started-sending', () => {
  console.log('Sending email...');
});

window.genuineForms['contact-form'].on('finished-sending', () => {
  console.log('Send attempt completed.');
});

// Remove event handlers
window.genuineForms['contact-form'].off('send-response');
```

**Available Events**

* `send-response` — Triggered after form submission completes. Receives `{ ok: boolean, body?: any, error?: any }`
* `validation-failed` — Triggered when form validation fails on submit attempt
* `started-sending` — Triggered immediately before sending the request
* `finished-sending` — Triggered after the request completes (success or failure)

---

## Customization Hooks (optional)

You can customize validation, payload generation, and initialization by defining the following global functions **before** the component initializes:

```html
<script>
  // Custom validation logic
  // Receives: formName (string), formElement (<genuine-form>)
  // Returns: boolean
  window.genuineFormHandleValidate = (formName, formElement) => {
    // Access form values
    const email = formElement.querySelector('[name="email"]');
    
    // Custom validation
    if (email && !email.value.includes('@')) {
      return false;
    }
    
    // You can still use the default validation
    return formElement.querySelectorAll('[required]').length > 0;
  };

  // Custom subject and body generation
  // Receives: formName (string), formElement (<genuine-form>), defaultSubject (string)
  // Returns: { subject: string, body: string }
  window.genuineFormGenerateSubjectAndBody = (formName, formElement, defaultSubject) => {
    const inputs = formElement.querySelectorAll('[name]');
    const data = {};
    
    inputs.forEach(input => {
      if (input.type === 'checkbox') {
        data[input.name] = input.checked;
      } else if (input.type === 'radio') {
        if (input.checked) data[input.name] = input.value;
      } else {
        data[input.name] = input.value;
      }
    });
    
    return {
      subject: `[${formName}] ${defaultSubject}`,
      body: JSON.stringify(data, null, 2)
    };
  };

  // Initialization callback
  // Receives: formName (string), formElement (<genuine-form>)
  window.genuineFormHandleInitialized = (formName, formElement) => {
    console.log(`Form "${formName}" is ready!`);
    // Perform any setup needed after the component initializes
  };
</script>
```

**Note:** The component waits up to 15 seconds for these global functions to be defined. If not found, sensible defaults are used.

---

## Styling

The component uses Shadow DOM with CSS custom properties for easy styling:

```css
genuine-form {
  --form-display: flex;
  --form-flex-direction: column;
  --form-gap: 1rem;
  --form-padding: 1rem;
  --form-border-radius: 0.5rem;
  --form-border: 1px solid #ccc;
  --form-background-color: #fff;
  --form-box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

Style the slotted content (your inputs and buttons) with regular CSS:

```css
genuine-form input {
  padding: 0.5rem;
  border: 1px solid #ddd;
}

genuine-form button[type="submit"] {
  background: #007bff;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  cursor: pointer;
}
```

---

## Multiple Forms on One Page

When using multiple forms on the same page, provide unique `name` attributes:

```html
<genuine-form name="contact-form" subject="Contact Request" api-key="YOUR_API_KEY">
  <!-- form fields -->
  <genuine-captcha>
    <button type="submit">Send</button>
  </genuine-captcha>
</genuine-form>

<genuine-form name="newsletter-form" subject="Newsletter Signup" api-key="YOUR_API_KEY">
  <!-- form fields -->
  <genuine-captcha>
    <button type="submit">Subscribe</button>
  </genuine-captcha>
</genuine-form>

<script>
  // Access each form's events independently
  window.genuineForms['contact-form'].on('send-response', (res) => {
    console.log('Contact form response:', res);
  });
  
  window.genuineForms['newsletter-form'].on('send-response', (res) => {
    console.log('Newsletter form response:', res);
  });
</script>
```

---

## Backend / Delivery

You have two options:

1. **Use the Genuine Forms hosted backend** (recommended):
   - Set your `api-key` attribute
   - The component sends data to `https://genuine-forms.io/api/gf-send-dev` by default
   - Override with `api-url` if needed

2. **Bring your own backend:**
   - Set a custom `api-url` attribute pointing to your endpoint
   - Your API should:
     - Accept GET requests with query parameters: `captchaSolution`, `captchaSecret`, `apiKey`, `subject`, `body`
     - Verify the captcha token
     - Send the email (e.g., via SMTP or a mail API)
     - Return JSON: `{ body: "success message" }` on success or appropriate error response

**Example custom endpoint:**
```html
<genuine-form 
  api-url="https://your-api.com/send-email"
  api-key="YOUR_KEY"
  subject="Contact Form">
  <!-- form fields -->
</genuine-form>
```

> **Security note:** Do not put private secrets in the browser. Keep API secrets on the server.

---

## Framework Notes

* **React/Vue/Svelte/etc.**: Custom Elements work out-of-the-box. Use standard HTML attributes (kebab-case).
* **SSR/Static**: Works on static hosts; the component upgrades on the client.
* **TypeScript**: Type definitions coming soon.

**React Example:**
```jsx
function ContactForm() {
  useEffect(() => {
    window.genuineForms['my-form']?.on('send-response', (res) => {
      if (res.ok) {
        alert('Thank you for your message!');
      }
    });
    
    return () => {
      window.genuineForms['my-form']?.off('send-response');
    };
  }, []);

  return (
    <genuine-form name="my-form" subject="Contact" api-key="YOUR_KEY">
      <input name="name" required />
      <input name="email" type="email" required />
      <genuine-captcha>
        <button type="submit">Send</button>
      </genuine-captcha>
    </genuine-form>
  );
}
```

---

## Accessibility

* Because you use native inputs, standard a11y applies (labels, focus order, contrast).
* Always include proper `<label>` elements for your inputs.
* Genuine Captcha offers an accessible fallback; ensure it's enabled in your configuration.

---

## Troubleshooting

* **Captcha doesn't appear** → Ensure the widget script is loading and not blocked by CSP/AdBlock.
* **Submit button does nothing** → Check that:
  - It's inside `<genuine-captcha>` 
  - It has `type="submit"`
  - The captcha is verified
  - All required fields are filled
* **Validation always fails** → Verify all required fields have a `name` attribute and valid values.
* **Events not firing** → Ensure you're accessing the correct form name: `window.genuineForms['your-form-name']`
* **Multiple submit buttons** → If you have multiple forms without unique `name` attributes, you'll see a console warning. Provide unique names.
* **CORS/Network errors** → Confirm your backend endpoint, allowed origins, and JSON response shape.
* **Custom functions not working** → Ensure they're defined before the component loads, or within the 15-second initialization window.

---

## Developer Early Preview

The developer early preview lets you try out Genuine Forms without an API key. You need to provide the receiver email address in an encrypted format using XOR encryption.

**Encrypt your email:**

```js
function xor_encrypt(key, data) {
  return data.split('').map(function(c, i) {
    return c.charCodeAt(0) ^ key.charCodeAt(Math.floor(i % key.length));
  });
}

// Replace with your email and choose a secret key
const encrypted = xor_encrypt("your-secret-key", "your-email@example.com");
console.log(encrypted.toString());
// Example output: '16,65,20,7,21,12,28,24,0,35,21,10,27,20,3,22,24,17,12,30,93,6,12,31'
```

**Use the encrypted email:**

```html
<genuine-form 
  receiver="16,65,20,7,21,12,28,24,0,35,21,10,27,20,3,22,24,17,12,30,93,6,12,31" 
  subject="Contact Request"
  name="preview-form">
  <input name="first-name" required /> <br />
  <input name="last-name" required /> <br />
  <input name="email" type="email" required /> <br />
  <textarea name="message" rows="8"></textarea> <br />
  <input name="privacy" type="checkbox" required /> <br />

  <genuine-captcha>
    <button type="submit">Send</button>
  </genuine-captcha>
</genuine-form>
```

> **Important:** 
> - Don't use the example encrypted string above—create your own
> - Never commit your encryption key or plain email to your repository
> - This is for development/preview only; use `api-key` for production

Need help? Message via Reddit: https://www.reddit.com/user/love2Bbreath3Dlife/

---

## Roadmap

* ✅ Event-driven architecture
* ✅ Shadow DOM with CSS custom properties
* ✅ Multiple forms support
* ✅ Custom validation and payload generation
* ⬜ POST JSON submission option
* ⬜ TypeScript type definitions
* ⬜ Comprehensive unit tests
* ⬜ First-party React/Vue wrappers (optional)
* ⬜ Enhanced error messages and debugging

---

## API Reference Summary

### Form Collection
The component automatically collects form data from:
- Text inputs → `string`
- Checkboxes → `boolean`
- Radio buttons → `string` (selected value)
- Select (single) → `string`
- Select (multiple) → `string[]`
- Textareas → `string`

### Validation Rules
Built-in validation checks:
- Required fields must have values
- Email inputs must be valid email format
- Checkboxes with `required` must be checked
- Radio groups with `required` must have one selected
- Multi-selects with `required` must have at least one option selected

---

## License

MIT

---

## Contributing

Issues and pull requests welcome! Please ensure any changes maintain backward compatibility and include appropriate documentation updates.

---

## Changelog

### Current Version
- Event-driven architecture with `.on()` and `.off()` methods
- Shadow DOM implementation with CSS custom properties
- Multiple form support with unique `name` attributes
- Custom validation, payload generation, and initialization hooks
- Support for custom API endpoints via `api-url`
- Comprehensive form value collection and validation

See Git tags/releases for detailed version history.