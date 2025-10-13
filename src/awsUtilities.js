import { DateTime } from 'luxon';

import jwtManager from './jwtManager';
import DEBUG from './logger';
import store from './store';
import {
  getDirectoryFromHash,
  hasCredentialsInHash,
  loadCredentialsFromHash
} from './urlState';

const sha256 = str => crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));

const generateNonce = async () => {
  const hash = await sha256(crypto.getRandomValues(new Uint32Array(4)).toString());
  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const base64URLEncode = string => btoa(String.fromCharCode.apply(null, new Uint8Array(string))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export async function login(forceLogin) {
  const searchParams = new URL(window.location).searchParams;
  store.initialized = true;
  
  // Check for hash credentials first
  if (hasCredentialsInHash()) {
    try {
      const hashConfig = loadCredentialsFromHash();
      await setDirectCredentials({
        accessKeyId: hashConfig.accessKeyId,
        secretAccessKey: hashConfig.secretAccessKey,
        region: hashConfig.region
      });
      
      // Set bucket and other config from hash
      if (hashConfig.bucketName) {
        store.currentBucket = hashConfig.bucketName;
      }
      if (hashConfig.delimiter) {
        store.delimiter = hashConfig.delimiter;
      }
      
      // Load directory from hash parameters
      const directoryFromHash = getDirectoryFromHash();
      if (directoryFromHash) {
        store.currentDirectory = directoryFromHash;
      }
      
      store.autoLoginIn = true;
      store.showSettings = false;
      return;
    } catch (error) {
      DEBUG.log('Hash credentials failed, falling back to other methods:', error);
    }
  }
  
  
  if (store.tokens && DateTime.fromSeconds(jwtManager.decode(store.tokens.access_token).exp) > DateTime.utc()) {
    store.autoLoginIn = true;
    store.showSettings = false;
    return;
  }
  store.tokens = null;

  const code = searchParams.get('code');
  if (code !== null) {
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete('nonce');
    newUrl.searchParams.delete('expires_in');
    newUrl.searchParams.delete('access_token');
    newUrl.searchParams.delete('id_token');
    newUrl.searchParams.delete('state');
    newUrl.searchParams.delete('code');
    newUrl.searchParams.delete('iss');
    window.history.replaceState({}, undefined, newUrl.toString());

    const codeVerifier = localStorage.getItem('codeVerifier');
    if (codeVerifier === null) {
      throw new Error('Unexpected code');
    }

    const codeExchangeBody = Object.entries({
      grant_type: 'authorization_code',
      client_id: store.applicationClientId,
      code,
      code_verifier: codeVerifier,
      redirect_uri: `${window.location.origin}${window.location.pathname}`
    }).map(([k, v]) => `${k}=${v}`).join('&');

    const res = await fetch(`${store.applicationLoginUrl}/oauth2/token`, {
      method: 'POST',
      headers: new Headers({ 'content-type': 'application/x-www-form-urlencoded' }),
      body: codeExchangeBody
    });
    if (!res.ok) {
      throw new Error(await res.json());
    }
    const tokens = await res.json();
    store.tokens = tokens;
    store.showSettings = false;
    store.autoLoginIn = true;
    return;
  }

  DEBUG.log('Validating login parameters');
  if (!store.awsAccountId || !store.applicationLoginUrl || !store.applicationClientId || !store.identityPoolId) {
    DEBUG.log('Missing required parameter for login', store.awsAccountId, store.applicationLoginUrl, store.applicationClientId, store.identityPoolId);
    store.showSettings = true;
    return;
  }

  try {
    // eslint-disable-next-line no-new
    new URL(store.applicationLoginUrl);
  } catch (error) {
    DEBUG.log('Invalid application login url:', store.applicationLoginUrl);
    return;
  }

  if (!forceLogin && !store.autoLoginIn) {
    return;
  }
  // otherwise redirect login
  store.autoLoginIn = false;
  const nonce = await generateNonce();
  const codeVerifier = await generateNonce();
  localStorage.setItem('codeVerifier', codeVerifier);
  const codeChallenge = base64URLEncode(await sha256(codeVerifier));
  // redirect to login
  const redirectUri = `${window.location.origin}${window.location.pathname}`;
  store.loggedOut = false;
  window.location = `${store.applicationLoginUrl}/oauth2/authorize?response_type=code&client_id=${store.applicationClientId}&state=${nonce}&code_challenge_method=S256&code_challenge=${codeChallenge}&redirect_uri=${redirectUri}`;
  const waiter = new Promise(resolve => setTimeout(resolve, 2000));
  await waiter;
}





export async function setDirectCredentials(credentials) {
  
  try {
    // Set AWS configuration
    AWS.config.update({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region: credentials.region
    });

    // Test the credentials by calling STS
    const sts = new AWS.STS({ region: credentials.region });
    const stsResult = await sts.getCallerIdentity().promise();
  
    
    // Update store with user info
    store.userRoleId = stsResult.Arn.split('/')[1];
    store.awsAccountId = stsResult.Account;
    store.region = credentials.region;
    
    return true;
  } catch (error) {
    DEBUG.log('Failed to set direct credentials:', error);
    throw error;
  }
}
