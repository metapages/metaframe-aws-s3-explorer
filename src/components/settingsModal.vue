<template>
  <div>
    <div class="modal-backdrop" @click="closeModal"></div>
    <div class="modal-dialog">
      <div class="modal-content" @click.stop>
        <form @submit.prevent="directLogin()">
          <div>
            <div class="modal-header">
              <h4 class="modal-title">S3 Explorer: Settings</h4>
              <button type="button" class="close" @click="closeModal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="col-md-18">
                <div class="" style="width: 100%;">
                  <div>
                    Update your AWS credentials and configuration:
                  </div>
                  <br>
                  
                  <div class="form-group">
                    <label for="accessKeyId">AWS Access Key ID:</label>
                    <input 
                      id="accessKeyId"
                      name="accessKeyId" 
                      v-model.trim="formState.accessKeyId"
                      type="text" 
                      class="form-control" 
                      placeholder="AKIAIOSFODNN7EXAMPLE" 
                      required="true">
                  </div>

                  <div class="form-group">
                    <label for="secretAccessKey">AWS Secret Access Key:</label>
                    <input 
                      id="secretAccessKey"
                      name="secretAccessKey" 
                      v-model.trim="formState.secretAccessKey"
                      type="password" 
                      class="form-control" 
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" 
                      required="true">
                  </div>

                  <div class="form-group">
                    <label for="bucketName">S3 Bucket Name:</label>
                    <input 
                      id="bucketName"
                      name="bucketName" 
                      v-model.trim="formState.bucketName"
                      type="text" 
                      class="form-control" 
                      placeholder="my-bucket-name" 
                      required="true">
                  </div>

                  <div class="form-group">
                    <label for="region">AWS Region:</label>
                    <select 
                      id="region"
                      name="region" 
                      v-model="formState.region"
                      class="form-control" 
                      required="true">
                      <option value="">Select Region</option>
                      <option value="us-east-1">US East (N. Virginia)</option>
                      <option value="us-east-2">US East (Ohio)</option>
                      <option value="us-west-1">US West (N. California)</option>
                      <option value="us-west-2">US West (Oregon)</option>
                      <option value="eu-west-1">Europe (Ireland)</option>
                      <option value="eu-west-2">Europe (London)</option>
                      <option value="eu-west-3">Europe (Paris)</option>
                      <option value="eu-central-1">Europe (Frankfurt)</option>
                      <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                      <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
                      <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                      <option value="ap-northeast-2">Asia Pacific (Seoul)</option>
                      <option value="ap-south-1">Asia Pacific (Mumbai)</option>
                      <option value="ca-central-1">Canada (Central)</option>
                      <option value="sa-east-1">South America (São Paulo)</option>
                    </select>
                  </div>

                  <div style="text-align: center; margin-top: 20px;">
                    <button 
                      type="button" 
                      class="btn btn-default btn-lg" 
                      @click="closeModal"
                      style="margin-right: 10px;">
                      <i class="fas fa-times" /> Cancel
                    </button>
                    <button 
                      type="submit" 
                      class="btn btn-primary btn-lg" 
                      :disabled="!isFormValid">
                      <i class="fas fa-save" /> Save Settings
                    </button>
                  </div>

                  <hr>
                  
                  <div class="alert alert-info">
                    <h5><i class="fas fa-info-circle"></i> Security Note</h5>
                    <p>Your credentials are stored locally in your browser and are not transmitted to any external servers. Make sure you're using credentials with minimal required permissions for S3 access.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  onMounted,
  onUnmounted,
  reactive
} from 'vue';

import { setDirectCredentials } from '../awsUtilities';
import store from '../store';
import {
  loadCredentialsFromHash,
  saveCredentialsToHash
} from '../urlState';

// Local form state for credentials
const formState = reactive({
  accessKeyId: '',
  secretAccessKey: '',
  bucketName: '',
  region: ''
});

// Load existing credentials from hash if available
const existingConfig = loadCredentialsFromHash();
formState.accessKeyId = existingConfig.accessKeyId || '';
formState.secretAccessKey = existingConfig.secretAccessKey || '';
formState.bucketName = existingConfig.bucketName || '';
formState.region = existingConfig.region || '';

const isFormValid = computed(() => {
  return formState.accessKeyId && 
         formState.secretAccessKey && 
         formState.bucketName && 
         formState.region;
});

const directLogin = async () => {
  if (!isFormValid.value) {
    return;
  }
  
  try {
    await setDirectCredentials({
      accessKeyId: formState.accessKeyId,
      secretAccessKey: formState.secretAccessKey,
      region: formState.region
    });
    
    // Set the current bucket
    store.currentBucket = formState.bucketName;
    
    // Save credentials and configuration to hash parameters
    saveCredentialsToHash({
      accessKeyId: formState.accessKeyId,
      secretAccessKey: formState.secretAccessKey,
      bucketName: formState.bucketName,
      region: formState.region,
      currentDirectory: store.currentDirectory,
      delimiter: store.delimiter
    });
    
    // Hide the settings modal
    store.showSettings = false;
    
    // Mark as logged in
    store.autoLoginIn = true;
    store.loggedOut = false;
    
    // Trigger a page refresh to load bucket contents
    window.location.reload();
  } catch (error) {
    console.error('Failed to set credentials:', error);
    alert('Failed to connect to S3. Please check your credentials and try again.');
  }
};

const closeModal = () => {
  store.showSettings = false;
};

// Prevent body scroll when modal is open
onMounted(() => {
  document.body.classList.add('modal-open');
});

onUnmounted(() => {
  document.body.classList.remove('modal-open');
});
</script>
