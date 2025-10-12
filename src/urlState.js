import {
  deleteHashParamFromWindow,
  getHashParamValueJsonFromWindow,
  setHashParamValueJsonInWindow
} from '@metapages/hash-query';

/**
 * Load s3 path from hash parameters
 * @returns {string}
 */
export function getDirectoryFromHash() {
  return getHashParamValueJsonFromWindow("path");
}

/**
 * Save path hash parameters
 * @param {string} path - path to save
 */
export function saveDirectoryToHash(path) {
  setHashParamValueJsonInWindow("path", path);
}


/**
 * Load credentials and configuration from hash parameters
 * @returns {Object} Configuration object with credentials and settings
 */
export function loadCredentialsFromHash() {
  try {
    const config = getHashParamValueJsonFromWindow("config") || {};
    // Check if we have valid credentials
    config.hasValidCredentials = !!(config.accessKeyId && config.secretAccessKey && config.region);
    
    return config;
  } catch (error) {
    console.error('Failed to load credentials from hash:', error);
    return { hasValidCredentials: false };
  }
}

/**
 * Save credentials and configuration to hash parameters
 * @param {Object} config - Configuration object to save
 */
export function saveCredentialsToHash(config) {
  setHashParamValueJsonInWindow("config", config);
}

/**
 * Clear credentials from hash parameters
 */
export function clearCredentialsFromHash() {
  deleteHashParamFromWindow("config");
}

/**
 * Check if credentials exist in hash parameters
 * @returns {boolean} True if credentials exist in hash
 */
export function hasCredentialsInHash() {
  const config = loadCredentialsFromHash();
  return config.hasValidCredentials;
}
