


import {GenuineCaptcha} from 'https://cryptng.github.io/genuine-captcha-vanillajs/genuine-captcha.js';


export default class GenuineForm extends HTMLElement {
  shadowRoot = null;
  secret=null;
  solution=null;
  isVerifiedCaptcha=false;
  timerId=null;
  name='genuine-form';
  gfApiUrl = `https://genuine-forms.io/api/gf-send-dev`;

  handleSendResponse=async(response)=>{console.log("Default handleSendResponse:", response);};
  handleStartSending=async()=>{};
  handleFinishedSending=async()=>{};
  handleValidateForm=(name,form)=>{return _isValidForm(name,form);};
  handleValidationFailed=async ()=>{};
  handleInitialized=(name,form)=>{console.log("Default handleInitialized:", name, form);};
  generateSubjectAndBody=(name,form,subject='Generic Subject')=>{return {subject:subject,body:JSON.stringify( _collectFormValues(form))};};

  constructor() {
    super();
    this.prompt = '';
    this.secret = '';
    this.solution = '';
    this.receiver = '';
    this._apiKey=undefined
    this.subject = this.getAttribute('subject') || 'Generic Subject';
    this.events={
      on:(type, handler)=>{
        if(type==='send-response') this.handleSendResponse=(async (response)=>handler(response));
        if(type==='started-sending') this.handleStartSending=(async ()=>handler());
        if(type==='finished-sending') this.handleFinishedSending=(async ()=>handler());
        if(type==='validation-failed') this.handleValidationFailed=(async ()=>handler());
      },
      off:(type)=>{
        if(type==='send-response') this.handleSendResponse=(response)=>{console.log("Default handleSendResponse:", response); return response;};
        if(type==='started-sending') this.handleStartSending=async ()=>{};
        if(type==='finished-sending') this.handleFinishedSending=async ()=>{};  
        if(type==='validation-failed') this.handleValidationFailed=async ()=>{};
      }
    };

    if(!window.genuineForms) window.genuineForms={};
    const template = document.getElementById('genuine-form');
    const templateContent = template.content;

    const shadowRoot = this.attachShadow({ mode: 'open' });
    this.shadowRoot = shadowRoot;

    const style = document.createElement('style');
    style.textContent = `
          :host{
            --form-display:flex;
            --form-flex-direction:column;
            --form-gap:1rem;
            --form-padding:1rem;
            --form-border-radius:0.5rem;
            --form-border:1px solid #ccc;
            --form-background-color:#fff;
            --form-box-shadow:0 2px 4px rgba(0,0,0,0.1);
      
          }

          .genuine-form-container{
            display: var(--form-display);
            position: relative;
            flex-direction:  var(--form-flex-direction);
            gap: var(--form-gap);
          }
      `;

    shadowRoot.appendChild(style);
    shadowRoot.appendChild(templateContent.cloneNode(true));

    // shadowRoot.querySelector('[type="submit"]').addEventListener('click', (event) => {
    //   event.stopPropagation();
    //   this.sendForm(event);
    // });
    let slots = this.shadowRoot.querySelectorAll('slot');
    console.log(slots);

    

    window.genuineCaptchaHandleVerify=(solution, secret) =>{
        console.log("CAPTCHA verified:", solution, secret);
        this.isVerifiedCaptcha=true;
        this.solution=solution;
        this.secret=secret;
    }

    window.genuineCaptchaHandleReset=() =>{
        console.log("CAPTCHA resetted");
        this.mailTo='';
        this.isVerifiedCaptcha=false;
        this.solution='';
        this.secret='';
    }
    this.registerHandleValidateForm();
    this.registerGenerateSubjectAndBody();
  }

  connectedCallback() {
    window.genuineForms[this.name]=this.events;
    setTimeout(() => {
    const submitBtns = (!this.name || this.name==='genuine-form') ? window.document.querySelectorAll('genuine-form [type="submit"]'):window.document.querySelectorAll(`genuine-form[name="${this.name}"] [type="submit"]`);
    if(submitBtns.length>1 && !this.name) console.warn("Multiple submit buttons found in genuine-form, only the first one will be used. Use unique named genuine-form if you need multiple forms on one page.");
    if(submitBtns[0]) submitBtns[0].addEventListener('click', (event) => {
      event.stopPropagation();
      if(!this.isValidForm) this.handleValidationFailed();
      this.sendForm(event);
    });
    }, 100);

    (async()=>{
      await this.registerHandleInitialized();
      this.handleInitialized(this.name,this);
    })();
  }

  disconnectedCallback() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
 

  registerHandleValidateForm = async () => {
    let counter=0;
    while (window.genuineFormHandleValidate === undefined && counter<150) {
      counter++;
      await Sleep(100);
    }
    this.handleValidateForm = window.genuineFormHandleValidate || this.handleValidateForm;
  };

  registerHandleInitialized = async () => {
    let counter=0;
    while (window.genuineFormHandleInitialized === undefined && counter<150) {
      counter++;
      await Sleep(100);
    }
    this.handleInitialized = window.genuineFormHandleInitialized || this.handleInitialized;
  };

  registerGenerateSubjectAndBody = async () => {
    let counter=0;
    while (window.genuineFormGenerateSubjectAndBody === undefined && counter<150) {
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
    if (name === 'name') this.name = newValue;
    if (name === 'api-url') this.gfApiUrl = newValue;
  }

  get apiKey(){
    return this._apiKey || this.receiver;
  }

  sendForm=async (event)=>{
        event.preventDefault();
        if(!this.isVerifiedCaptcha || !this.isValidForm || this.apiKey===''){
            console.log("Form not valid or Captcha not verified or no receiver/api-key set.");
            return;
        }

        const {subject,body} = this.generateSubjectAndBody(this.name,this,this.subject);

        try{
            const url = this.gfApiUrl;
            const response = await fetch(`${url}/?captchaSolution=${this.solution}&captchaSecret=${encodeURIComponent(this.secret)}&apiKey=${this.apiKey}&subject=${subject}&body=${encodeURI(body)}`, {
                method: 'GET'
            });

            if(response.ok) {
                const {body} = await response.json();
                console.log('Success:', body);
                this.handleSendResponse ({
                  ok: true,
                  body: body
                });
            }else{
              this.handleSendResponse ({
                ok: false,
                error: 'Error sending request'
              });
            }
        
        }catch(error ){
            console.error('Error:', error);
            this.handleSendResponse ({
              ok: false,
              error: error
            });
            
        }
    }
}


async function Sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}


//defer loading because of fastboot and similar
if (typeof document !== 'undefined') {
  const tpl1 = document.createElement('template');
  tpl1.id = 'genuine-form';
  tpl1.innerHTML = `<script type="module" src="https://cryptng.github.io/genuine-captcha-vanillajs/genuine-captcha.js" defer></script>
  <form class="genuine-form-container">
        
        <slot></slot>
        </form>
        
    </div>`;

  document.querySelector('body').prepend(tpl1);

  customElements.define('genuine-form', GenuineForm);
}

function _isValidForm(name,rootNode) {
  const elements = rootNode.querySelectorAll("input, select, textarea");

  for (let el of elements) {
    if (!el.required) continue; // skip non-required fields

    if (el.tagName === "INPUT") {
      const type = el.type.toLowerCase();

      if (type === "checkbox") {
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
        value = el.checked;
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