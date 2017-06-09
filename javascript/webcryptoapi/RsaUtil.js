/**
 * @license
 * Copyright 2017 Google Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Some utilities for testing RSA on Web Crypto APIs
 */
goog.provide('wycheproof.webcryptoapi.RsaUtil');
goog.require('goog.testing.asserts');
goog.require('wycheproof.webcryptoapi.HashUtil');

var HashUtil = wycheproof.webcryptoapi.HashUtil;

wycheproof.webcryptoapi.RsaUtil.RSASSA_PKCS1 = 'RSASSA-PKCS1-v1_5';

/**
 * A class containing RSA signature test case's parameters
 * @param {!number} id
 * @param {!string} e RSA public exponent in base64url format
 * @param {!string} n RSA modulus in base64url format
 * @param {!string} hashAlg The hash algorithm used for the scheme.
 * @param {!string} scheme The usage scheme.
 * @param {!ArrayBuffer} msg The message to be verified
 * @param {!ArrayBuffer} sig The signature to be verified
 * @param {!string} result The test result
 */
wycheproof.webcryptoapi.RsaUtil.RsaSignatureTestCase
    = function(id, e, n, hashAlg, scheme, msg, sig, result) {
  this.id = id;
  this.e = e;
  this.n = n;
  this.hashAlg = hashAlg;
  this.scheme = scheme;
  this.msg = msg;
  this.sig = sig;
  this.result = result;
  this.pk = null;
  this.sk = null;
};

/**
 * Imports a RSA public key.
 * @param {!string} e RSA public exponent in base64url format
 * @param {!string} n RSA modulus in base64url format
 * @param {!string} schemeName The usage scheme.
 *     Supported values are "RSASSA-PKCS1-v1_5", "RSA-PSS".
 * @param {!string} hashAlg The hash algorithm used for the scheme.
 *     Supported values are "SHA-1", "SHA-256", "SHA-384", and "SHA-512".
 * @param {!Array<string>} usages An Array indicating what can be done with the key.
 *
 * @return {!Promise} A Promise object containing the public key
 */
wycheproof.webcryptoapi.RsaUtil.importPublicKey =
    function(e, n, schemeName, hashAlg, usages) {
  assertTrue('Unsupported hash algorithm', HashUtil.isSupported(hashAlg));
  return window.crypto.subtle.importKey(
      'jwk', {
          kty: 'RSA',
          e: e,
          n: n,
          ext: true,
      }, {
        name: schemeName,
        hash: {name: hashAlg},
      },
      false,
      usages
  );
};

/**
 * Verifies a RSA signature using the given public key.
 * @param {!CryptoKey} pk The public key object
 * @param {!ArrayBuffer} msg
 *     The message that was signed by the corresponding private key, in
 * @param {!ArrayBuffer} sig
 *     The signature to be verified
 * @param {!string} schemeName The signature scheme
 *
 * @return {!Promise} A Promise object containing the verification result.
 */
wycheproof.webcryptoapi.RsaUtil.verify = function(pk, msg, sig, schemeName) {
  return window.crypto.subtle.verify(
      {name: schemeName},
      pk,
      sig,
      msg
  );
};

/**
 * Tests importation of RSA public key
 *
 * @return {!Promise}
 */
wycheproof.webcryptoapi.RsaUtil.testImportPublicKey = function() {
  var tc = this;
  var promise = RsaUtil.importPublicKey(tc.e, tc.n, tc.scheme, tc.hashAlg, ['verify'])
      .then(function(pk){
    tc.pk = pk;
  }).catch(function(err){
      fail('Failed to import public key in test case ' + tc.id + ': ' + err);
  });
  return promise;
};


/**
 * Tests RSA signature verification.
 *
 * @return {!Promise}
 */
wycheproof.webcryptoapi.RsaUtil.testVerification = function() {
  var tc = this;
  var promise = wycheproof.webcryptoapi.RsaUtil
      .verify(tc.pk, tc.msg, tc.sig, tc.scheme)
      .then(function(isValid){
    if (tc.result == 'valid') {
      assertTrue('Failed on test case ' + tc.id, isValid);
    } else if (tc.result == 'invalid') {
      assertFalse('Failed on test case ' + tc.id, isValid);
    }
  }).catch(function(err){
    assertNotEquals('Failed on test case ' + tc.id, tc.result, 'valid');
    assertTrue('Expect an InvalidAccessError exception',
                  err instanceof InvalidAccessError);
  });
  return promise;
};