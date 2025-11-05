


//import {GenuineCaptcha} from 'https://cryptng.github.io/genuine-captcha-vanillajs/genuine-captcha.min.js';


export default class GenuineForm extends HTMLElement {
  secret=null;
  solution=null;
  isVerifiedCaptcha=false;
  timerId=null;
  gfApiUrl = 'https://genuine-forms.io/api/gf-send-dev/';

  handleSendResponse=new Map();
  handleStartSending=new Map();
  handleFinishedSending=new Map();
  handleValidationFailed=new Map();
  handleValidateForm=(name,form)=>{return _isValidForm(name,form);};
  handleInitialized=(name,form)=>{console.log("Default handleInitialized:", name, form);};
  generateSubjectAndBody=(name,form,subject='Generic Subject')=>{return {subject:subject,body:JSON.stringify( _collectFormValues(form))};};

  constructor() {
    super();
    this.name = this.getAttribute('name') || 'genuine-form';
    this.subject = this.getAttribute('subject') || 'Generic Subject';
    this._apiKey = this.getAttribute('api-key');
    this.receiver = this.getAttribute('receiver');
    this.gfApiUrl = this.getAttribute('api-url') || this.gfApiUrl;
    this.abortController = new AbortController();
    this.genuineCaptchaNode=null;
    this.events={
      on: (type, handler) => {
        const wrappedHandler = async (...args) => {
          try {
            await handler(...args);
          } catch (error) {
            console.error(`Error in ${type} handler:`, error);
          }
        };
        
        if (type === 'send-response') this.handleSendResponse.set(handler, wrappedHandler);
        if (type === 'started-sending') this.handleStartSending.set(handler, wrappedHandler);
        if (type === 'finished-sending') this.handleFinishedSending.set(handler, wrappedHandler);
        if (type === 'validation-failed') this.handleValidationFailed.set(handler, wrappedHandler);
      },
      off: (type,handler) => {
        if (type === 'send-response') this.handleSendResponse.delete(handler);
        if (type === 'started-sending') this.handleStartSending.delete(handler);
        if (type === 'finished-sending') this.handleFinishedSending.delete(handler);  
        if (type === 'validation-failed') this.handleValidationFailed.delete(handler);
      }
    };

    if(!window.genuineForms) window.genuineForms={};

    const template = document.getElementById('genuine-form');
    if (!template) {
      console.error('Template #genuine-form not found');
      return;
    }
    const templateContent = template.content;

    this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
          :host{
            --form-display:flex;
            --form-flex-direction:column;
            --form-gap:1rem;
            --form-padding:1rem;
            --form-border-radius:0.5rem;
            --form-border:1px solid #ccc;
            --form-background:transparent;
            --form-box-shadow:0 2px 4px rgba(0,0,0,0.1);
      
          }

          .genuine-form-container{
            display: var(--form-display);
            position: relative;
            flex-direction:  var(--form-flex-direction);
            gap: var(--form-gap);
            background:var(--form-background);
          }
      `;

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(templateContent.cloneNode(true));

    this.setupCaptchaHandlerRegistry();
 
    this.hooksReady = Promise.all([
      this.registerHandleValidateForm(),
      this.registerGenerateSubjectAndBody(),
      this.registerHandleInitialized()
    ]);
  }

  setupCaptchaHandlerRegistry() {
    // Create global handler registry if it doesn't exist
    if (!window._genuineFormHandlers) {
      window._genuineFormHandlers = new Map();
      
      // Store original handler if exists
      const originalHandler = window.genuineCaptchaHandleVerify;
      
      // Create global dispatcher
      window.genuineCaptchaHandleVerify = (name, solution, secret) => {
        // Call all registered form handlers
        window._genuineFormHandlers.forEach((handler) => {
          handler(name, solution, secret);
        });
        
        // Call original handler if it existed
        if (originalHandler) {
          originalHandler(name, solution, secret);
        }
      };
    }
    
    // Create this form's handler
    this.myHandleVerify = (name, solution, secret) => {
      if (name === this.name) {
        console.log("CAPTCHA verified for form:", name);
        this.isVerifiedCaptcha = true;
        this.solution = solution;
        this.secret = secret;
      }
    };
    
    // Setup reset handler using same pattern
    if (!window._genuineFormResetHandlers) {
      window._genuineFormResetHandlers = new Map();
      
      const originalResetHandler = window.genuineCaptchaReset;
      
      window.genuineCaptchaReset = (name) => {
        window._genuineFormResetHandlers.forEach((handler) => {
          handler(name);
        });
        
        if (originalResetHandler) {
          originalResetHandler(name);
        }
      };
    }
    
    this.myHandleReset = (name) => {
      if (name === this.name) {
        console.log("CAPTCHA reset for form:", name);
        this.isVerifiedCaptcha = false;
        this.solution = '';
        this.secret = '';
      }
    };
  }

  connectedCallback() {
    window.genuineForms[this.name]=this.events;

    (async () => {
        await this.handleInitialized(this.name, this);
    })();

    if (window._genuineFormHandlers) {
      window._genuineFormHandlers.set(this.name, this.myHandleVerify);
    }
    if (window._genuineFormResetHandlers) {
      window._genuineFormResetHandlers.set(this.name, this.myHandleReset);
    }

    this.setupObserver = new MutationObserver(() => {
      if (!this.submitButton) {
        this.setupSubmitButton();
      }
      if (!this.genuineCaptchaNode) {
        this.findCaptchaNode();
      }
    });
    
    this.setupObserver.observe(this, {
      childList: true,
      subtree: true
    });
    
    // Initial setup with small delay to allow children to render
    this.setupTimeout = setTimeout(async () => {
      this.setupSubmitButton();
      await this.setupCaptcha();
    }, 100);

  }

  disconnectedCallback() {
      if (this.setupTimeout) {
      clearTimeout(this.setupTimeout);
      this.setupTimeout = null;
    }
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    
    // Abort any ongoing requests
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    
    // Remove event listener
    if (this.submitButton && this.submitHandler) {
      this.submitButton.removeEventListener('click', this.submitHandler);
      this.submitButton = null;
      this.submitHandler = null;
    }
    
    // Disconnect observer
    if (this.setupObserver) {
      this.setupObserver.disconnect();
      this.setupObserver = null;
    }
    
    // Cleanup global registries
    if (window.genuineForms && window.genuineForms[this.name]) {
      delete window.genuineForms[this.name];
    }
    
    if (window._genuineFormHandlers) {
      window._genuineFormHandlers.delete(this.name);
    }
    
    if (window._genuineFormResetHandlers) {
      window._genuineFormResetHandlers.delete(this.name);
    }
  }
 
  setupSubmitButton() {
    // Query only this form's submit buttons
    const submitBtns = this.querySelectorAll('[type="submit"]');
    
    if (submitBtns.length > 1) {
      console.warn(`Multiple submit buttons found in genuine-form[name="${this.name}"], only the first one will be used.`);
    }
    
    if (submitBtns[0] && !this.submitButton) {
      this.submitButton = submitBtns[0];
      this.submitHandler = (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        if (!this.isValidForm) {
          this.handleValidationFailed.forEach((handler)=>handler());
          return;
        }
        
        this.sendForm(event);
      };
      this.submitButton.addEventListener('click', this.submitHandler);
    }
  }

  async setupCaptcha() {
    await this.findCaptchaNode();
    
    if (this.genuineCaptchaNode) {
      // Set captcha name attribute
      this.genuineCaptchaNode.setAttribute('name', this.name);
   
    } else {
      console.error(`Missing <genuine-captcha> web component in genuine-form[name="${this.name}"]`);
    }
  }

  async findCaptchaNode() {
    return new Promise((resolve) => {
      const find = () => {
        const slot = this.shadowRoot.querySelector('slot');
        if (!slot) {
          resolve(null);
          return;
        }
        
        const slotChildren = slot.assignedNodes();
        
        for (const node of slotChildren) {
          if (node.nodeName === 'GENUINE-CAPTCHA') {
            this.genuineCaptchaNode = node;
            resolve(node);
            return;
          }
          
          if (node.nodeType === Node.ELEMENT_NODE) {
            const captcha = node.querySelector('genuine-captcha');
            if (captcha) {
              this.genuineCaptchaNode = captcha;
              resolve(captcha);
              return;
            }
          }
        }
        
        resolve(null);
      };
      
      if (this.genuineCaptchaNode){
        resolve(this.genuineCaptchaNode);
        return;
      }
      // Try immediately
      find();
      
      // If not found, try again after delay
      if (!this.genuineCaptchaNode) {
        setTimeout(() => {
          find();
        }, 100);
      }
    });
  }

  registerHandleValidateForm = async () => {
    let counter=0;
    while (window.genuineFormHandleValidate === undefined && counter<20) {
      counter++;
      await Sleep(100);
    }
    this.handleValidateForm = window.genuineFormHandleValidate || this.handleValidateForm;
  };

  registerHandleInitialized = async () => {
    let counter=0;
    while (window.genuineFormHandleInitialized === undefined && counter<20) {
      counter++;
      await Sleep(100);
    }
    this.handleInitialized = window.genuineFormHandleInitialized || this.handleInitialized;
  };

  registerGenerateSubjectAndBody = async () => {
    let counter=0;
    while (window.genuineFormGenerateSubjectAndBody === undefined && counter<20) {
      counter++;
      await Sleep(100);
    }
    this.generateSubjectAndBody = window.genuineFormGenerateSubjectAndBody || this.generateSubjectAndBody;
  }

  get isValidForm(){
    return this.handleValidateForm(this.name,this);
  }

  static get observedAttributes() {
    return ['subject','receiver','api-key','name','api-url'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'subject') this.subject = newValue;
    if (name === 'receiver') this.receiver = newValue;
    if (name === 'api-key') this._apiKey = newValue;
    if (name === 'api-url') this.gfApiUrl = newValue;
    if (name === 'name') this.name = newValue;
  }

  get apiKey(){
    return this._apiKey || this.receiver;
  }

  sendForm=async (event)=>{
    event.preventDefault();
    if (this.isSending) {
      console.log("Form submission already in progress");
      return;
    }
    if(!this.isVerifiedCaptcha || !this.isValidForm || this.apiKey===''){
        console.log("Form not valid or Captcha not verified or no receiver/api-key set.");
        return;
    }

    await this.hooksReady;

    const {subject,body} = this.generateSubjectAndBody(this.name,this,this.subject);

    if (subject.length > 200) {
      console.error('Subject too long (max 200 characters)');
      this.handleSendResponse.forEach((handler)=>handler({
        ok: false,
        error: 'Subject too long'
      }));
      return;
    }

    this.isSending = true;
    this.setAttribute('data-sending', '');

    if (this.submitButton) {
      this.submitButton.disabled = true;
    }

    try{
      if (this.abortController) {
        this.abortController.abort();
      }
      this.abortController = new AbortController();

      this.handleStartSending.forEach((handler)=>handler());
      
      const response = await fetch(this.gfApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          captchaSolution: this.solution,
          captchaSecret: this.secret,
          apiKey: this.apiKey,
          subject: subject,
          body: body
        }),
        signal: this.abortController.signal
      });

      if(response.ok) {
        const data = await response.json();
    
        // Validate response structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format');
        }
        
        console.log('Success:', data.body || data);
        
        this.handleSendResponse.forEach((handler)=>handler({
          ok: true,
          body: data.body || data
        }));
        
        // Dispatch success event
        this.dispatchEvent(new CustomEvent('form-submit-success', {
          detail: { body: data.body || data },
          bubbles: true,
          composed: true
        }));
        
        // Reset form after successful submission
        this.resetForm();
      }else{
        const errorText = await response.text();
    
        this.handleSendResponse.forEach((handler)=>handler({
          ok: false,
          status:response.status,
          error: `${errorText}`
        }));
        
        // Dispatch error event
        this.dispatchEvent(new CustomEvent('form-submit-error', {
          detail: { error: `Server error: ${response.status}` },
          bubbles: true,
          composed: true
        }));
      }
    
    }catch(error ){
      if (error.name === 'AbortError') {
        console.log('Form submission aborted');
        return;
      }
      
      console.error('Error:', error);
      
      this.handleSendResponse.forEach((handler)=>handler({
        ok: false,
        error: error.message || 'Unknown error'
      }));
      
      // Dispatch error event
      this.dispatchEvent(new CustomEvent('form-submit-error', {
        detail: { error: error.message },
        bubbles: true,
        composed: true
      }));
        
    }finally {
      this.isSending = false;
      
      // Remove loading state
      this.removeAttribute('data-sending');
      
      // Re-enable submit button
      if (this.submitButton) {
        this.submitButton.disabled = false;
      }
      
      this.handleFinishedSending.forEach((handler)=>handler());
    }
  }

  resetForm() {
    // Reset captcha state
    this.isVerifiedCaptcha = false;
    this.solution = '';
    this.secret = '';
    
    // Reset form fields
    const form = this.shadowRoot.querySelector('form');
    if (form) {
      form.reset();
    }
    
    // Trigger captcha reload
    if (this.genuineCaptchaNode && typeof this.genuineCaptchaNode.loadCaptcha === 'function') {
      this.genuineCaptchaNode.loadCaptcha();
    }
  }
}


async function Sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

if (typeof document !== 'undefined') {
  if (!customElements.get('genuine-form')) {
    const initTemplate = () => {
      if (!document.getElementById('genuine-form')) {
        const tpl1 = document.createElement('template');
        tpl1.id = 'genuine-form';
        tpl1.innerHTML = `<script type="module" src="https://cryptng.github.io/genuine-captcha-vanillajs/genuine-captcha.min.js" defer></script>
        <form class="genuine-form-container">
          <slot></slot>
        </form>`;
        
        if (document.body) {
          document.body.prepend(tpl1);
        } else {
          document.addEventListener('DOMContentLoaded', () => {
            if (document.body && !document.getElementById('genuine-form')) {
              document.body.prepend(tpl1);
            }
          });
        }
      }
    };
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initTemplate);
    } else {
      initTemplate();
    }
    
    customElements.define('genuine-form', GenuineForm);
  }
}



function _isValidForm(name,rootNode) {
  const elements = rootNode.querySelectorAll("input, select, textarea");

  for (let el of elements) {
    if (!el.required) continue; // skip non-required fields

    if (el.tagName === "INPUT") {
      const type = el.type.toLowerCase();

      if (type === "email") {
        if(! el.checkValidity()) return false;
      } else if (type === "checkbox") {
        if (!el.checked) return false;
      } else if (type === "radio") {
        // find radios with the same name and check if at least one is checked
        const group = rootNode.querySelectorAll(`input[type="radio"][name="${el.name}"]`);
        const checked = Array.from(group).some(radio => radio.checked);
        if (!checked) return false;
      } else {
        if (!el.value.trim()) return false;
      }

    } else if (el.tagName === "SELECT") {
      if (el.multiple) {
        if (el.selectedOptions.length === 0) return false;
      } else {
        if (!el.value) return false;
      }

    } else if (el.tagName === "TEXTAREA") {
      if (!el.value.trim()) return false;
    }
  }

  return true;
}


function _collectFormValues(rootNode) {
  const result = {};

  // Query all form elements inside the root node
  const elements = rootNode.querySelectorAll("input, select, textarea");

  elements.forEach(el => {
    const name = el.name;
    if (!name) return; // Skip if no name attribute

    let value;

    if (el.tagName === "INPUT") {
      if (el.type === "checkbox") {
        value= (el.value || '').length>0? (el.value+':'+el.checked):el.checked
      } else if (el.type === "radio") {
        if (el.checked) {
          value = el.value;
        } else {
          return; // skip unchecked radios
        }
      } else {
        value = el.value;
      }
    } else if (el.tagName === "SELECT") {
      if (el.multiple) {
        value = Array.from(el.selectedOptions).map(opt => opt.value);
      } else {
        value = el.value;
      }
    } else {
      // textarea and other generic cases
      value = el.value;
    }

    // Handle multiple elements with the same name (e.g. checkbox groups)
    if (result.hasOwnProperty(name)) {
      if (!Array.isArray(result[name])) {
        result[name] = [result[name]];
      }
      result[name].push(value);
    } else {
      result[name] = value;
    }
  });

  return result;
}


export {GenuineForm };