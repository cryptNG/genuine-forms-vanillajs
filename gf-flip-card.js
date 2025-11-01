


//import {GenuineCaptcha} from 'https://cryptng.github.io/genuine-captcha-vanillajs/genuine-captcha.min.js';


export default class GFFlipCard extends HTMLElement {

  constructor() {
    super();
    this.name = this.getAttribute('name') || 'genuine-form';
    this.events={
      on: (type, handler) => {
        const wrappedHandler = async (...args) => {
          try {
            await handler(...args);
          } catch (error) {
            console.error(`Error in ${type} handler:`, error);
          }
        };
        
        //if (type === 'send-response') this.handleSendResponse = wrappedHandler;
      },
      off: (type) => {
        //if (type === 'send-response') this.handleSendResponse = (response) => { console.log("Default handleSendResponse:", response); };
      }
    };

    if(!window.genuineForms) window.genuineForms={};

    const template = document.getElementById('gf-flip-card');
    if (!template) {
      console.error('Template #gf-flip-card not found');
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
            --form-border:1px solid rgba(0,0,0,0.1);
            --form-background-color:transparent;
            --form-box-shadow:0 0 15px rgba(0,0,0,0.1);
      
          }

          .flip-card{
            
            
          }

          ::slotted(.gf-front-container) {
            padding:0;
            display: var(--form-display);
            position: relative;
            flex-direction:  var(--form-flex-direction);
            gap: var(--form-gap);
            background-color:var(--form-background-color);
          }

          .flip-card {
            position: relative;
            perspective: 500px;
          }

          .flip-card .content {
            position: relative;
            padding:var(--form-padding);
            border-radius:var(--form-border-radius);
            border:var(--form-border);
            background-color:var(--form-background-color);
            box-shadow:var(--form-box-shadow);

            transition: transform 1.5s;
            transform-style: preserve-3d;
         
          }

          .flip-card.flipped .content {
            transform: rotateY( 180deg ) ;
            transition: transform 0.5s;
          }

          .flip-card .front,
          .flip-card .back {
            position: relative;
            border-radius:var(--form-border-radius);
            background-color:var(--form-background-color);
            backface-visibility: hidden;
            padding: 0;
            margin: 0;
            height: calc(100% );
          }

          .flip-card .back {
            transform: rotateY( 180deg );
            display: flex;
            align-items: center;
            flex-direction: column;
            top: 1rem;
            position: absolute;
            gap: 1rem;
            width: calc(100% - 4rem);
            justify-content: center;
          }

          .flip-card .back>*.hide{
            display:none;
          }
      `;

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(templateContent.cloneNode(true));

 
    this.hooksReady = Promise.all([
      this.registerHandleInitialized(),
      
    ]);
  }

  connectedCallback() {
    this.name = this.closest('genuine-form')?.attributes['name']?.value;
    this.flipCard = this.shadowRoot.querySelector('.flip-card');
    this.workingSpinner = this.shadowRoot.querySelector('.working-state');
    this.flipCardFront = this.shadowRoot.querySelector('.flip-card .front');

    this.flipCard.querySelector('.close-handler').addEventListener('click',()=>{
      this.flipCard.classList.remove('flipped');
    });

    this.shadowRoot.querySelector('slot[name="front"]').addEventListener("slotchange", (e) => {
      this.flipCardBackOk = e.target;
      this.flipCardBackOk.assignedElements()[0]?.classList.add('gf-front-container');
    });

    this.shadowRoot.querySelector('slot[name="back-ok"]').addEventListener("slotchange", (e) => {
      this.flipCardBackOk = e.target;
      this.flipCardBackOk.assignedElements()[0].querySelector('button.close')?.addEventListener('click',()=>{
        this.flipCard.classList.remove('flipped');
      })
    });

    this.shadowRoot.querySelector('slot[name="back-error"]').addEventListener("slotchange", (e) => {
      this.flipCardBackError = e.target;
      this.flipCardBackError.assignedElements()[0].querySelector('button.close')?.addEventListener('click',()=>{
        this.flipCard.classList.remove('flipped');
      })
    });

    this.registerResponseHandler();
    

  }

  disconnectedCallback() {
     this.unregisterResponseHandler();
  }
 
  registerResponseHandler = async () => {

    let counter=0;
    while (window.genuineForms[this.name] === undefined && counter<150) {
      counter++;
      await Sleep(100);
    }

    if(window.genuineForms[this.name]===undefined){
      console.error(`No genuine-form ${this.name} event handler found in window. Component will not work. Omitting event registration` );
      return;
    }

    window.genuineForms[this.name].on('send-response',this.handleSendResponse);
    window.genuineForms[this.name].on('started-sending',this.handleStartedSending);
    window.genuineForms[this.name].on('finished-sending',this.handleFinishedSending);
  }
  

  unregisterResponseHandler = async () => {
    if(window.genuineForms[this.name]===undefined){
      console.error(`No genuine-form ${this.name} event handler found in window. Component will not work. Omitting event unregistration` );
      return;
    }
    window.genuineForms[this.name].off('send-response');
    window.genuineForms[this.name].off('started-sending');
    window.genuineForms[this.name].off('finished-sending');
  }

  handleStartedSending = async () => {
    this.workingSpinner.classList.add('show');
  }

  handleFinishedSending = async () => {
    this.workingSpinner.classList.remove('show');
  }
  
  handleSendResponse = async (response) => {
    if(response.ok){
        this.flipCardBackError.classList.add('hide');
        this.flipCardBackOk.classList.remove('hide');
        
        
    }else{
      this.flipCardBackError.classList.remove('hide');
      this.flipCardBackOk.classList.add('hide');
    }
    this.flipCard.classList.add('flipped');
  }

  registerHandleInitialized = async () => {
    let counter=0;
    while (window.gfFlipCardHandleInitialized === undefined && counter<150) {
      counter++;
      await Sleep(100);
    }
    this.handleInitialized = window.gfFlipCardHandleInitialized || this.handleInitialized;
  };

  
}


async function Sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

if (typeof document !== 'undefined') {
  if (!customElements.get('gf-flip-card')) {
    const initTemplate = () => {
      if (!document.getElementById('gf-flip-card')) {
        const tpl1 = document.createElement('template');
        tpl1.id = 'gf-flip-card';
        tpl1.innerHTML = `
        <style>.loader {
  width: 32px;
  height: 32px;
  transform: translateY(100%);
  border-radius: 50%;
  background: #000;
  position: relative;
    display: block;
    left: 50%;
    top: 50%;
}
.loader:before , .loader:after{
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #000;
  left: 50%;
  transform: translateX(-50%);
  top: -200%;
}
.loader:after {
  animation: moveX 0.5s infinite linear alternate;
}

@keyframes moveX {
  0% {
    top: 0% ;
    transform: translateX(-50%) scale(1.5);
  }
  50% {
    top: -75% ;
    transform: translateX(-50%) scale(0.5);
  }
  100% {
    top: -200%;
    transform: translateX(-50%) scale(1.5);
  }
}
  .working-state{
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    opacity:0;
    background-color: white;
  }

  .working-state.show{
    opacity:0.5;
    transition:all 0.5s ease-in-out;
  }
  .working-state:not(.show){
    animation:hide 0.5s forwards;
  }
    @keyframes hide {
      0% {
        top: 0% ;
      }
      99% {
        top: 0% ;
        opacity:0;
      }
    
      100% {
        top: -100%;
      }
    }
  </style>
        <div class="flip-card">
          <a class="close-handler" style="display:none;">&nbsp;</a>
          
          <div class="content">
            <div class="front">
              <slot name="front"></slot>
             
              <div class="working-state">
                <slot name="loader"><span class="loader"></span></slot>
              </div>
            </div>
            <div class="back">
              <slot name="back-ok"></slot>
              <slot name="back-error"></slot>
            </div>
            
          </div>
        </div>`;
        
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
    
    customElements.define('gf-flip-card', GFFlipCard);
  }
}



export {GFFlipCard };