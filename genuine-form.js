

//defer loading because of fastboot and similar


export default class GenuineForm extends HTMLElement {
  shadowRoot = null;
  secret=null;
  solution=null;
  isVerifiedCaptcha=false;
  timerId=null;
  gcApiUrl = window.location.origin.indexOf('localhost')>-1 ? window.location.origin : `https://api.genuine-captcha.io`;

  handleSendResponse=(response)=>{console.log("Default handleSendResponse:", response); return response;};
  handleValidateForm=(form)=>{return _isValidForm(form);};
  generateSubjectAndBody=(form,subject='Generic Subject')=>{return {subject:subject,body:JSON.stringify( _collectFormValues(form))};};

  constructor() {
    super();
    this.prompt = '';
    this.secret = '';
    this.solution = '';
    this.subject = this.getAttribute('subject') || 'Generic Subject';
    const template = document.getElementById('genuine-form');
    const templateContent = template.content;

    const shadowRoot = this.attachShadow({ mode: 'open' });
    this.shadowRoot = shadowRoot;

    const style = document.createElement('style');
    style.textContent = `
          :host{
            --underline-color:red;
            --underline-style:dashed;
            --underline-width:0.1em;
            --underline-top:calc(50% + 0.5em);
            --text-color:inherited;
            --text-family:revert;
            --text-size:auto;
            --text-cursor:pointer;
            --underline-rgb:linear-gradient(90deg, #e50b58,#b29d23,#55ddbd);
            --underline-rgb-1:linear-gradient(90deg, #ae1ffd,#ff3c34,#9bbf24);
            --underline-rgb-2:linear-gradient(130deg,#2E3192,#1BFFFF 76.05%);
            --underline-rgb-3:linear-gradient(130deg,#ff7a18,#af002d 41.07%,#319197 76.05%);
            --underline-rgb-5:linear-gradient(130deg,#ff7a18,#af002d 41.07%,#319197 76.05%);
            --asterisk-margin-right:0.2em;
          }

          .genuine-form-container{
            display: inline-block;
            position: relative; 
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
    this.registerHandleSendResponse();
    this.registerHandleValidateForm();
    this.registerGenerateSubjectAndBody();
  }

  connectedCallback() {
       setTimeout(() => {
        const submitBtn = window.document.querySelector('[type="submit"]')
        if(submitBtn) submitBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          this.sendForm(event);
        });
       }, 100);
  }

  disconnectedCallback() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
  registerHandleSendResponse = async () => {
    
    while (window.genuineFormHandleSendResponse === undefined) {
      await Sleep(100);
    }
    this.handleSendResponse = window.genuineFormHandleSendResponse;
  };

  registerHandleValidateForm = async () => {
    
    while (window.genuineFormHandleValidate === undefined) {
      await Sleep(100);
    }
    this.handleValidateForm = window.genuineFormHandleValidate;
  };

  registerGenerateSubjectAndBody = async () => {
    
    while (window.genuineFormGenerateSubjectAndBody === undefined) {
      await Sleep(100);
    }
    this.generateSubjectAndBody = window.genuineFormGenerateSubjectAndBody;
  }

  get isValidForm(){
    return this.handleValidateForm(this);
  }

  static get observedAttributes() {
    return ['subject'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'subject') this.subject = newValue;
  }

  sendForm=async (event)=>{
        event.preventDefault();
        if(!this.isVerifiedCaptcha || !this.isValidForm){
            return;
        }

        const {subject,body} = this.generateSubjectAndBody(this,this.subject);

        try{
            const url = window.location.origin.indexOf('localhost')>-1 ? 'https://www.novent-concepts.de' : `${window.location.origin}`;
            const response = await fetch(`${url}/api/captcha/send.json/?captchaSolution=${this.solution}&captchaSecret=${encodeURIComponent(this.secret)}&subject=${subject}&body=${body}`, {
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

function _isValidForm(rootNode) {
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