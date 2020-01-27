/*
 *  This family of functions was NOT assembled by an
 *  expert on elliptic curve cryptography.  However,
 *  by using this module, no trust is required to be
 *  put into the server, unlike the old oblivious
 *  transfer protocol where the server is depended
 *  on to provide for random data.
 */

const elliptic = require('elliptic');
const lib = elliptic.ec('ed25519');

/**
 * rand - Return a buffer of b random bytes
 * @param  {number} b bytes
 * @returns {Object} Uint8Array
 */
const rand = (b) => elliptic.rand(b);

/**
 * random - Return a group element chosen at random
 * @returns {Object} point
 */
const random = () => mult_g(lib.curve.point(rand(32)));

/**
 * add - Point addition
 * @param  {Object} p point
 * @param  {Object} o point
 * @returns {Object} point result of p + o
 */
const add = (p, o) => p.add(o);

/**
 * sub - Point subtraction
 * @param  {Object} p point
 * @param  {Object} o point
 * @returns {Object} point result of p + -o
 */
const sub = (p, o) => p.add(o.neg());

/**
 * mult - Scalar multiplication
 * @param  {Object} p base point
 * @param  {Object} o point to derive the scalar value from
 * @returns {Object} point result of p + ... + p = p * o
 */
const mult = (p, o) => p.mul(o.x);

/**
 * mult_g - Generator multiplication
 * @param  {Object} o point to derive the scalar value from
 * @returns {Object} point result of g + ... + g = g * o
 */
const mult_g = (o) => mult(lib.g, o);

/**
 * inv - Scalar inverse by point negation
 * @param  {Object} p point
 * @returns {Object} inverse point
 */
const inv = (p) => p.neg();

/**
 * valid - Does this point exist on the curve?
 * @param  {Object} p point
 * @returns {boolean}
 */
const valid = (p) => p.validate();

/**
 * point2hash - Point-to-hash using sodium
 * @param  {type} p elliptic curve point
 * @param  {number} len = 32 output bytes
 * @returns {Object} hash digest - 32 byte Uint8Array object
 */
const point2hash = (p, len = 32) => {
    const e = new Uint8Array(p.encode());  // 64 bytes, or p.encodeCompressed() for 32 bytes
    const salt = new Uint8Array(32);  // constant is fine
    const digest = sodium.crypto_pwhash_scryptsalsa208sha256(len, e, salt, 0, 0);
    return digest;
};

/**
 * point2str - Serialize
 * @param  {Object} p elliptic curve point
 * @returns {string} JSON string
 */
const point2str = (p) => JSON.stringify(p.encodeCompressed());

/**
 * str2point - Parse
 * @param  {string} str - JSON string
 * @returns {Object} elliptic curve point
 */
const str2point = (str) => lib.curve.decodePoint(JSON.parse(str));

module.exports = {
  random: random,
  add: add,
  sub: sub,
  mult: mult,
  mult_g: mult_g,
  inv: inv,
  valid: valid,
  point2hash: point2hash,
  point2str: point2str,
  str2point: str2point
};
