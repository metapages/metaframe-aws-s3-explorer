<template>
  <DropzoneWrapper @fileAdded="fileAdded">
    <div class="col-12">

      <div class="panel panel-primary">
        <!-- Panel including bucket/folder information and controls -->
        <div class="panel-heading" style="width: 100%; display: flex; direction: row; align-items: center; justify-content: space-between;">

          <!-- Bucket selection and breadcrumbs -->
          <div style="display: flex; direction: row; align-items: center; justify-content: flex-start;">
            <div class="title d-flex" style="align-items: center; margin-right: 0.1rem;">
              <h4>S3:</h4>
            </div>
            
            <!-- S3 bucket and path -->
            <div v-if="isAuthenticated && store.currentBucket" style="margin-right: 1rem; flex: 1; white-space: nowrap; font-weight: bold; color: white;">
              <span><a @click="exploreDirectory(null)" style="color: white; cursor: pointer;">{{ store.currentBucket }}</a></span>&nbsp;/&nbsp;
              <span v-for="(part, partIndex) in pathParts" :key="part">
                <a :style="{
                    'text-decoration': partIndex + 1 === pathParts.length ? 'none' : undefined,
                    'color': 'white',
                    'cursor': partIndex + 1 === pathParts.length ? 'unset' : 'pointer'
                  }"
                  @click="exploreDirectory(pathParts.slice(0, partIndex + 1).join(store.delimiter))">
                  {{ part.length > 30 ? `${part.slice(0, 30)}…` : part }}
                </a>&nbsp;/&nbsp;
              </span>
            </div>
            
            <div v-if="isAuthenticated && !store.currentBucket" style="margin-right: 1rem;">
              <span style="color: #666; font-weight: 500;">No Bucket Selected</span>
            </div>
          </div>

          <!-- Folder/Bucket radio group and progress spinner -->
          <div id="navbuttons">
            <div class="btn-group d-flex" style="align-items: center;">
              <div v-if="store.currentBucket && isAuthenticated">
                <span style="cursor: pointer; padding: 8px;" class="btn fa fa-sync fa-lg" :class="{ 'fa-spin': state.loading }" @click="refresh()" title="Reload the directory" />
              </div>
              <span style="cursor: pointer; padding: 8px;" class="btn fa fa-cog fa-lg" @click="openSettings()" title="Edit Settings" />
              <span style="cursor: pointer; padding: 8px;" class="btn fa" @click="openGithub()" title="Check out the source at Github.com"><img src="../assets/github-logo.svg" height="20"></span>
            </div>
          </div>
        </div>

        <div v-if="store.globalLoader" style="flex-grow: 1; display: flex; align-items: center; justify-content: center;">
          <loader />
        </div>

        <template v-else>
          <!-- Panel including S3 object table -->
          <div class="panel-body">

            <!-- Fixed header content -->
            <div style="flex-shrink: 0; width: 100%;">
              <template v-if="isAuthenticated && store.currentBucket">
                <div class="d-flex justify-content-between align-items-center" style="padding-top: 0.5rem; width: 100%;">
                  <!-- Left side: Filter and object count -->
                  <div style="display: flex; align-items: center; gap: 1rem; width: 100%;">
                    <input class="filter-results" type="text" v-model="state.filterText" placeholder="Filter results...">
                    
                    <!-- Object count -->
                    <div style="flex-shrink: 0;">
                      <div class="btn-group" v-if="selectedKeysCount === 0">
                        <span id="badgecount" style="cursor: default; color: #999; background: none; border: none; padding: 0;" title="Object count">{{ store.objects.length }} {{ store.objects.length !== 1 ? 'objects' : 'object' }}</span>
                      </div>
                      <!-- Record/checked count -->
                      <div class="btn-group" v-if="selectedKeysCount > 0">
                        <span id="badgecount" style="cursor: default; color: #999; background: none; border: none; padding: 0;" title="Selected object count">{{ selectedKeysCount }} of {{ store.objects.length }} selected</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Right side: Action buttons -->
                  <div style="flex-shrink: 0; display: flex; flex-direction: row; flex-wrap: no-wrap; gap: 0.5rem;">
                    <button type="button" style="cursor: pointer;" class="text-primary btn btn-xs btn-secondary"
                      :disabled="!selectedKeysCount" @click="sendSelectedFilesToMetaframe" title="Send selected files via metaframe">
                      <i class="fa fa-paper-plane" style="margin-right: 0.5rem" />Send Selected
                    </button>
                    <button type="button" style="cursor: pointer;" class="text-primary btn btn-xs btn-secondary"
                      :disabled="!selectedKeysCount" @click="downloadFiles" title="Download files">
                      <i class="fa fa-cloud-download-alt" style="margin-right: 0.5rem" />Download
                    </button>
                    <button type="button" style="cursor: pointer;" class="text-primary btn btn-xs btn-secondary" @click="store.showAddFolder = true" title="New">
                      <i class="fa fa-folder-plus" style="margin-right: 0.5rem" />New
                    </button>
                    <button type="button" style="cursor: pointer;" class="text-primary btn btn-xs btn-secondary"
                      :disabled="!selectedKeysCount" @click="store.showTrash = true" title="Delete">
                      <i class="fa fa-trash-alt" style="margin-right: 0.5rem" />Delete
                    </button>
                  </div>
                </div>
              </template>
            </div>

            <div v-if="isAuthenticated" style="flex: 1; overflow: auto; min-height: 0; margin-top: 1rem; padding-bottom: 0.25rem;">
              <table class="table table-bordered table-hover table-striped" style="width:100%;" id="s3objects-table">
              <thead>
                <tr>
                  <th class="text-center" style="text-align: center; cursor: pointer" @click="state.globalSelect = !state.globalSelect">
                    <input type="checkbox" v-model="state.globalSelect">
                  </th>
                  <th>Object</th>
                  <th style="text-align: right;">Last Modified</th>
                  <!-- <th>Class</th> -->
                  <th style="text-align: right;">Size</th>
                  <th style="text-align: center;">Copy</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="path in sortedObjects.filter(o => o.type === 'DIRECTORY')" :key="path.key" :class="{ 'last-selected': state.lastSelectedKey === path.key }">
                  <td style="text-align: center; cursor: pointer" @click.stop="() => state.selectedKeys[path.key] = !state.selectedKeys[path.key]">
                    <input type="checkbox" v-model="state.selectedKeys[path.key]">
                  </td>
                  <td><i class="fas fa-folder" style="margin-right: 1rem" /><a @click="exploreDirectory(path.key)" style="cursor: pointer;">
                    {{ path.key.split(store.delimiter).slice(-1)[0] || store.delimiter }}</a>
                  </td>
                  <td style="text-align: center" />
                  <!-- <td style="text-align: center" /> -->
                  <td style="text-align: center" />
                  <td style="text-align: center;">
                    <button type="button" class="btn btn-xs btn-secondary" @click.stop="copyDownloadLink(path.key)" title="Copy download link">
                      <i class="fa fa-copy"></i>
                    </button>
                  </td>
                </tr>
                <tr v-for="path in sortedObjects.filter(o => o.type === 'PATH' && o.key.split(store.delimiter).slice(-1)[0])" :key="path.key" @click="sendFilesToMetaframe(path.key)" :class="{ 'last-selected': state.lastSelectedKey === path.key }">
                  <td style="text-align: center; cursor: pointer" @click.stop="() => state.selectedKeys[path.key] = !state.selectedKeys[path.key]">
                    <input type="checkbox" v-model="state.selectedKeys[path.key]">
                  </td>
                  <td>{{ path.key.split(store.delimiter).slice(-1)[0] }}</td>
                  <td style="text-align: right; font-size: 12px;">{{ path.lastModified }}</td>
                  <!-- <td style="text-align: center">{{ path.storageClass }}</td> -->
                  <td style="text-align: right;">{{ formatByteSize(path.size) }}</td>
                  <td style="text-align: center;">
                    <button type="button" class="btn btn-xs btn-secondary" @click.stop="copyDownloadLink(path.key)" title="Copy download link">
                      <i class="fa fa-copy"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
              </table>
            </div>
          </div>
        </template>
        </div>
      </div>


    <div class="panel panel-success" v-if="store.awsAccountId && store.tokens && store.currentBucket" @click="store.showUploads = true" style="cursor: pointer">
      <div class="panel-heading" style="display: flex; direction: row; align-items: center; justify-content: space-between;">

        <div style="display: flex; direction: row; align-items: center">
          <div class="title ">Dropzone</div>
        </div>
      </div>

      <div class="panel-body" style="overflow: auto; text-align: center">
        Drag and drop files and folders you want to upload here.
        <br><br>
        <div class="text-muted">
          <strong>No files or folders</strong><br>
          You have not chosen any files or folders to upload.
        </div>

      </div>
    </div>

    <div v-if="!store.globalLoader" class="col-12">
      <SettingsModal v-if="store.showSettings" />
      <BucketSelectorModal v-if="store.showBucketSelector" />
      <AddFolderModal v-if="store.showAddFolder" />
      <TrashModal v-if="store.showTrash" :selectedKeys="Object.keys(state.selectedKeys).filter(k => state.selectedKeys[k])" @trashCompleted="uploadsCompleted" />
      <UploadModal v-if="store.showUploads" :filesToUpload="state.filesToUpload" @uploadsCompleted="uploadsCompleted" />
    </div>

  </DropzoneWrapper>
</template>

<script setup>
import {
  computed,
  onMounted,
  reactive,
  watch
} from 'vue';

import { login } from '../awsUtilities';
import {
  downloadObjects,
  fetchBucketObjects
} from '../bucketManager';
import { formatByteSize } from '../converters';
import DEBUG from '../logger';
import store, { getBuckets } from '../store';
import {
  clearCredentialsFromHash,
  getDirectoryFromHash,
  hasCredentialsInHash,
  saveCredentialsToHash,
  saveDirectoryToHash
} from '../urlState';
import AddFolderModal from './addFolderModal.vue';
import BucketSelectorModal from './bucketSelectorModal.vue';
import DropzoneWrapper from './dropzoneWrapper.vue';
import Loader from './loader.vue';
import SettingsModal from './settingsModal.vue';
import TrashModal from './trashModal.vue';
import UploadModal from './uploadModal.vue';

const state = reactive({ objectCount: 0, selectedKeys: {}, filesToUpload: [], globalSelect: false, filterText: '', lastSelectedKey: null });

// Check if user is authenticated (either via tokens or hash credentials)
const isAuthenticated = computed(() => {
  return store.tokens || hasCredentialsInHash();
});

const refresh = async () => {
  const spinnerAsync = new Promise(resolve => setTimeout(resolve, 1000));
  try {
    state.loading = true;
    await fetchBucketObjects();
  } catch (error) {
    store.showBucketSelector = true;
  }
  await spinnerAsync;
  state.loading = false;
};

const logout = () => {
  store.objects = [];
  store.loggedOut = true;
  store.autoLoginIn = false;
  store.showBucketSelector = false;

  // Clear hash credentials
  clearCredentialsFromHash();

  if (store.tokens) {
    store.tokens = null;
    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    window.location = store.applicationLoginUrl ? `${store.applicationLoginUrl}/logout?client_id=${store.applicationClientId}&logout_uri=${redirectUri}` : window.location.origin;
    return;
  }

  store.showSettings = true;
};

const openSettings = () => {
  store.showSettings = true;
};

const selectBucket = () => {
  store.showBucketSelector = true;
};

onMounted(async () => {
  if (store.loggedOut) {
    store.showSettings = true;
    store.globalLoader = false;
    return;
  }

  if (store.initialized) {
    store.globalLoader = false;
    return;
  }

  await login();
  store.globalLoader = false;

  // Check if authenticated (either via tokens or direct credentials)
  if (!isAuthenticated.value) {
    store.showSettings = true;
    store.objects = [];
    return;
  }

  if (!store.currentBucket) {
    if (getBuckets().length) {
      store.currentBucket = getBuckets()[0].bucket?.trim().toLowerCase();
    } else {
      store.showBucketSelector = true;
      store.objects = [];
      return;
    }
  }

  await refresh();
});

const fileAdded = file => {
  state.filesToUpload.push(file);
  store.showUploads = true;
};

// Expose fileAdded function globally for metaframe integration
window.addFileToUploadQueue = fileAdded;

const exploreDirectory = async directory => {
  state.selectedKeys = {};
  state.globalSelect = false;
  store.currentDirectory = directory;
  
  // Save directory to hash parameters
  saveDirectoryToHash(directory);
  
  await fetchBucketObjects();
};

const uploadsCompleted = async () => {
  state.filesToUpload = [];
  state.selectedKeys = {};
  await fetchBucketObjects();

  if (!store.objects.length) {
    await exploreDirectory(store.currentDirectory.split(store.delimiter).slice(0, -1).join(store.delimiter));
  }
};

const downloadFiles = async () => {
  await downloadObjects(store.currentBucket, Object.keys(state.selectedKeys));
};

const sendFilesToMetaframe = async (fileKeys) => {
  if (typeof fileKeys === 'string') {
    fileKeys = [fileKeys];
    // Track the last selected file
    state.lastSelectedKey = fileKeys[0];
  } else {
    // For multiple files, track the last one
    state.lastSelectedKey = fileKeys[fileKeys.length - 1];
  }
  
  try {
    const files = Object.fromEntries(fileKeys.map((fileKey) => {
      // Generate pre-signed URL using AWS S3
      const s3 = new AWS.S3({ region: store.region });
      const params = {
        Bucket: store.currentBucket,
        Key: fileKey,
        Expires: 3600 // URL expires in 1 hour
      };
      
      const url = s3.getSignedUrl('getObject', params);
      return [fileKey, {type:"url", value: url, timestamp: Date.now()}];
    }));
    
    // Send via metaframe output
    if (window.metaframe) {
      window.metaframe.setOutputs(files);
    }
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
  }
};

const sendSelectedFilesToMetaframe = async () => {
  try {
    const selectedKeys = Object.keys(state.selectedKeys).filter(key => state.selectedKeys[key]);
    
    if (selectedKeys.length === 0) {
      return;
    }
    
    // Collect all files to send (including nested files from folders)
    const allFilesToSend = [];
    
    for (const key of selectedKeys) {
      const object = store.objects.find(obj => obj.key === key);
      if (object) {
        if (object.type === 'PATH') {
          // It's a file, add it directly
          allFilesToSend.push(key);
        } else if (object.type === 'DIRECTORY') {
          // It's a folder, find all files within this folder
          const folderFiles = store.objects
            .filter(obj => obj.type === 'PATH' && obj.key.startsWith(key + store.delimiter))
            .map(obj => obj.key);
          allFilesToSend.push(...folderFiles);
        }
      }
    }
    
    if (allFilesToSend.length === 0) {
      return;
    }
    
    // Send all files via metaframe
    await sendFilesToMetaframe(allFilesToSend);
    
  } catch (error) {
    console.error('Error sending selected files:', error);
  }
};

const copyDownloadLink = async (fileKey) => {
  try {
    const s3 = new AWS.S3({ region: store.region });
    const params = {
      Bucket: store.currentBucket,
      Key: fileKey,
      Expires: 3600 // URL expires in 1 hour
    };
    const url = s3.getSignedUrl('getObject', params);
    
    // Copy to clipboard
    await navigator.clipboard.writeText(url);
    
    // Optional: Show a brief success message
    console.log('Download link copied to clipboard');
    
  } catch (error) {
    console.error('Error generating or copying download link:', error);
  }
};

const sortedObjects = computed(() => store.objects.filter(o => !state.filterText || o.key.includes(state.filterText)).sort((a, b) => a.key.localeCompare(b.key)));
const selectedKeysCount = computed(() => Object.keys(state.selectedKeys).filter(key => !store.deletedObjects[key] && state.selectedKeys[key]).length);

const pathParts = computed(() => {
  if (store.currentDirectory === store.delimiter) {
    return [store.currentDirectory];
  }
  return store.currentDirectory && store.currentDirectory.split(store.delimiter) || [];
});

const openGithub = () => { window.open('https://github.com/metapages/metaframe-aws-s3-explorer#aws-s3-explorer', '_blank'); };

const globalSelectWatcher = computed(() => state.globalSelect);

watch(globalSelectWatcher, newValue => {
  sortedObjects.value.forEach(o => {
    // Include both files and folders in global select
    state.selectedKeys[o.key] = newValue;
  });
});
</script>

<style lang="scss" scoped>
a {
  color: #2e6da4;
}

.d-flex {
  display: flex;
  width: 100%;

  .align-items-center {
    align-items: center;
  }
  .justify-content-center {
    justify-content: space-around;
  }
}

.filter-results {
  cursor: pointer;
  display: block;
  width: 300px;
  min-width: 200px;
  margin: 0;
  padding: 0.25rem 1rem;
  background-size: 15px 15px;
  background: white no-repeat 15px center;
  font-size: 14px;
  border: 1px solid #ddd !important;
  border-radius: 4px;
  box-shadow: rgba(50, 50, 93, 0.25) 0px 2px 5px -1px,
    rgba(0, 0, 0, 0.3) 0px 1px 3px -1px;
}

/* Hide button text on small screens, show only icons */
@media (max-width: 768px) {
  .btn-xs {
    padding: 2px 6px !important;
    font-size: 10px !important;
  }
  
  .btn-xs i {
    margin-right: 0 !important;
  }
  
  .btn-xs span:not(.fa):not(.fas):not(.far):not(.fab) {
    display: none;
  }
  
  .btn-xs {
    min-width: auto !important;
    width: auto !important;
  }
}

/* Ensure all table rows have consistent border width */
#s3objects-table tbody tr {
  border: 2px solid transparent !important;
}

/* Highlight last selected row */
.last-selected {
  border: 2px solid #007bff !important;
  background-color: rgba(0, 123, 255, 0.1) !important;
}
</style>
