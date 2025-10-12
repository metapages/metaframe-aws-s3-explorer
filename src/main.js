import './explorer.css';

// https://v3.vuejs.org/api/application-api.html
import { createApp } from 'vue';

import VueClipboard from 'vue3-clipboard';

import { Metaframe } from '@metapages/metapage';

import App from './App.vue';

const app = createApp(App);

// https://github.com/FortAwesome/vue-fontawesome
// import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
// import { library, dom } from '@fortawesome/fontawesome-svg-core';
// dom.watch();
// import { faSpinner } from '@fortawesome/free-solid-svg-icons/faSpinner';
// library.add(faSpinner);
// app.component('Fa', FontAwesomeIcon);

app.use(VueClipboard, { autoSetContainer: true, appendToBody: true });

// Initialize metaframe
const metaframe = new Metaframe();

// Handle metaframe inputs as files to upload to S3
const handleInputs = (inputs) => {
  
  // Convert inputs to files and upload to S3
  if (inputs && typeof inputs === 'object') {
    Object.entries(inputs).forEach(([key, value]) => {
      if (!value) {
        return;
      }
      if (typeof value === 'string') {
        // Create a file-like object from the input
        const file = {
          name: key,
          content: value,
          size: new Blob([value]).size,
          type: 'text/plain'
        };
        
        // Add to upload queue
        addFileToUploadQueue(file);
      } else if (typeof value === 'object') {

        if (value instanceof Blob) {
          // Create file object with content type from response
          const file = {
            name: key,
            content: value,
            size: value.size,
            type: value.type || 'application/octet-stream'
          };
          
          // Add to upload queue
          addFileToUploadQueue(file);
        
        } else if (value?.type === "url") {
          const url = value.value;
          // Download the URL content
          fetch(url)
            .then(async response => {
              const contentType = response.headers.get('content-type');
              return response.blob().then(blob => ({blob, contentType}));
            })
            .then(({blob, contentType}) => {
              // Create file object with content type from response
              const file = {
                name: key,
                content: blob,
                size: blob.size,
                type: contentType || 'application/octet-stream'
              };
              
              // Add to upload queue
              addFileToUploadQueue(file);
            })
            .catch(error => {
              console.error('Error downloading URL:', error);
            });
        } else  {
          // assume json
          const file = {
            name: key,
            content: value,
            type: 'application/json'
          };
          // Add to upload queue
          addFileToUploadQueue(file);
        }

      }
    });
  }
};

// Function to add file to upload queue
const addFileToUploadQueue = (file) => {
  // Use the globally exposed function from home.vue
  if (window.addFileToUploadQueue) {
    window.addFileToUploadQueue(file);
    
    // Auto-start uploads after a brief delay to ensure modal is rendered
    setTimeout(() => {
      // Trigger upload by simulating click on upload button
      const uploadButton = document.querySelector('[data-action="upload"]');
      if (uploadButton) {
        uploadButton.click();
      }
    }, 100);
  }
};

// Default AWS region and v4 signature
AWS.config.update({ region: '' });
AWS.config.update({ signatureVersion: 'v4' });

app.mount('#app');

// Set up metaframe input handler after app is mounted
// Wait for app to be ready
setTimeout(() => {
  metaframe.onInputs(handleInputs);
  
  // Expose metaframe globally for use in components
  window.metaframe = metaframe;
}, 100);
