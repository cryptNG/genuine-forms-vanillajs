export default class GFCameraComponent extends HTMLElement {

  constructor() {
    super();
    this.name = this.getAttribute('name') || 'genuine-form';
    this.quality = this.getAttribute('quality') || 0.9;
    this.required = (this.getAttribute('required') || null)!==null;
    this.payloadName = this.getAttribute('payload-name') || 'camera-photo';
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

    const template = document.getElementById('gf-camera-component');
    if (!template) {
      console.error('Template #gf-camera-component not found');
      return;
    }
    const templateContent = template.content;

    this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');

    style.textContent = `
          :host{
            margin: auto;
          }

          gf-camera-component {
            margin: auto;
          }
          
          .camera-capture {
            --width:calc(min( 32rem, 100vw) - 4rem);
            --height:calc( var(--width) * 0.75);
            --video-width:calc(var(--width) * 2);
            --video-height:calc( var(--video-width) * 0.75);
            width:var(--width);
            height:var(--height);
            margin: auto;
            top: 0;
            left: 0;
            overflow: hidden;
            align-items: center;
            position: relative;
            display: flex;
            justify-content: center;
            flex-direction: column;
          }

          
          .camera-capture button#take-photo {
            width:var(--width);
            height:calc(var(--height) - 1px);
            position: absolute;
            top: 0;
            left: 0;
            padding: 0.5rem 2rem;
            border-radius: var(--form-primary-border-radius);
            border: var(--form-file-border);
            z-index: 1;
            background-color: #80808000;
            color: var(--form-text-muted);
            font-size: var(--form-input-font-size);
            text-align: center;
            line-height: var(--video-height);
            cursor: pointer;
                display: inline-flex;
            align-items: center;
            flex-direction: row;
            gap: 1rem;
            justify-content: center;
          }

          .camera-capture button#take-photo.required {
              border: var(--form-error-message-border,1px solid var(--form-error, red));
              
          }
          
          .camera-capture button#take-photo svg{
                fill:var(--form-text-muted);
                width:32px;
                height:32px;
          }

          .camera-capture button#take-photo.hide{
            opacity: 0;
            animation: gf-camera-hide 0.3s linear forwards;
          }
          
          video#player {
            width:var(--video-width);
            height:var(--video-height);
            position: absolute;
            top: 0;
            left: 0;
            object-fit: cover;opacity: 0;
            opacity: 0;
            border-radius: var(--form-primary-border-radius);
            animation: gf-camera-hide 0.3s linear forwards;
            transform: scale(0.5);
            transform-origin: top left;
          }
          video#player.show {
            opacity: 1;
            animation: none;
          }

          button#capture,button#retake {
            position: absolute;
            padding: 0.5rem 2rem;
            border-radius: var(--form-primary-border-radius);
            border: var(--form-primary-border);
            z-index: 1;
            background-color: var(--form-primary);
            color: var(--form-primary-text);
            font-size: calc(var(--form-input-font-size) * 0.9);
            bottom: 0.5rem;
            opacity: 0;
            animation: gf-camera-hide 0.3s linear forwards;
          }

          video#player.show ~ button#capture {
            opacity: 1;
            animation: none;
          }


          canvas#canvas {
            position: absolute;
            top: 0;
            left: 0;
            width:var(--video-width);
            height:var(--video-height);
            border-radius: var(--form-primary-border-radius);
            opacity: 0;
            animation: gf-camera-hide 0.3s linear forwards;
            transform: scale(0.5);
            transform-origin: top left;
          }
          canvas#canvas.show {
            opacity: 1;
            animation: none;
          }

          canvas#canvas.show ~ button#retake {
            opacity: 1;
            animation: none;
          }
          @keyframes gf-camera-hide {
            0% {
              top: 0% ;
              left: 0%;
            }
            99% {
              top: 0% ;
              left: 0%;
              opacity:0;
            }
          
            100% {
              top: -100%;
              left: -100%;
            }
          }
`;

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(templateContent.cloneNode(true));

    

    this.player = this.shadowRoot.getElementById('player');
    this.activate = this.shadowRoot.getElementById('take-photo');
    this.canvas = this.shadowRoot.getElementById('canvas');
    this.context = this.canvas.getContext('2d');
    this.captureButton = this.shadowRoot.getElementById('capture');
    this.retakeButton = this.shadowRoot.getElementById('retake');

    if(this.required) this.activate.classList.add('required');

    this.constraints = {
      video: true,
    };

  

 
    this.hooksReady = Promise.all([
      this.registerClickEvents(),
      this.registerHandleInitialized(),
      
    ]);
  }

  static get observedAttributes() {
    return ['payload-name','quality','required'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'payload-name') this.payloadName = newValue;
    if (name === 'quality') this.quality = newValue;
    if (name === 'required'){ 
      this.required=newValue!==null;
      if(this.required){
        this.activate.classList.add('required');
      }else{
        this.activate.classList.remove('required');
      }
    }
  }

  connectedCallback() {
    this.name = this.closest('genuine-form')?.attributes['name']?.value || this.name;
 
    this.registerResponseHandler();
  }

  disconnectedCallback() {
     this.unregisterResponseHandler();
  }

  registerClickEvents = async () => {
    this.activate.addEventListener('click', () => {
      // Attach the video stream to the video element and autoplay.
      navigator.mediaDevices.getUserMedia(this.constraints).then((stream) => {
          this.player.srcObject = stream;
      });

      this.activate.classList.add('hide');   
      this.player.classList.add('show');   
      this.canvas.width=this.player.clientWidth;
      this.canvas.height=this.player.clientHeight;
    });
    this.captureButton.addEventListener('click', () => {
      // Draw the video frame to the canvas.
      
      this.context.drawImage(this.player, 0, 0, this.player.clientWidth, this.player.clientHeight);
      this.player.classList.remove('show');
      this.canvas.classList.add('show');
      

      var img = this.canvas.toDataURL('image/webp', this.quality).replace('data:', '').replace(/^.+,/, '');
      window.genuineForms[this.name].call('set-payload',this.payloadName, {
          type: 'file',
          fileName: this.payloadName+'.webp',
          fileType: 'image/png',
          content64: img
      });
    });

    this.retakeButton.addEventListener('click', () => {
      window.genuineForms[this.name].call('unset-payload', null);

      this.player.classList.add('show');
      this.canvas.classList.remove('show');

    });
  };
 
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
  }
  

  unregisterResponseHandler = async () => {
    if(window.genuineForms[this.name]===undefined){
      console.error(`No genuine-form ${this.name} event handler found in window. Component will not work. Omitting event unregistration` );
      return;
    }
  }

  registerHandleInitialized = async () => {
    let counter=0;
    while (window.gfCameraComponentHandleInitialized === undefined && counter<150) {
      counter++;
      await Sleep(100);
    }
    this.handleInitialized = window.gfCameraComponentHandleInitialized || this.handleInitialized;
  };

  
}


async function Sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

if (typeof document !== 'undefined') {
  if (!customElements.get('gf-camera-component')) {
    const initTemplate = () => {
      if (!document.getElementById('gf-camera-component')) {
        const tpl1 = document.createElement('template');
        tpl1.id = 'gf-camera-component';
        tpl1.innerHTML = `
<style>
        .form-field>gf-camera-component{
          margin:auto;
        }
  
</style>
      <div class="camera-capture">
          <button id="take-photo"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M208,56H180.28L166.65,35.56A8,8,0,0,0,160,32H96a8,8,0,0,0-6.65,3.56L75.71,56H48A24,24,0,0,0,24,80V192a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V80A24,24,0,0,0,208,56Zm8,136a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8H80a8,8,0,0,0,6.66-3.56L100.28,48h55.43l13.63,20.44A8,8,0,0,0,176,72h32a8,8,0,0,1,8,8ZM128,88a44,44,0,1,0,44,44A44.05,44.05,0,0,0,128,88Zm0,72a28,28,0,1,1,28-28A28,28,0,0,1,128,160Z"></path></svg> Take a photo of you</button>
          <video id="player" controls playsinline autoplay></video>
          <button id="capture">Capture</button>
          <canvas id="canvas"></canvas>
          <button id="retake">Retake</button>
      </div>`;

    
        if (document.body) {
          document.body.prepend(tpl1);
        } else {
          document.addEventListener('DOMContentLoaded', () => {
            if (document.body && !document.getElementById('gf-camera-component')) {
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
    
    customElements.define('gf-camera-component', GFCameraComponent);
  }
}



export {GFCameraComponent };