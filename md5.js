/*
 * Minimal dependency-free MD5 implementation.
 * Operates on an ArrayBuffer and returns a lowercase hex digest.
 * Included locally (no network/CDN) to satisfy fully offline operation.
 * Based on the public RFC 1321 algorithm definition.
 */

function md5ArrayBuffer(buffer) {
  const bytes = new Uint8Array(buffer);
  const bitLength = bytes.length * 8;

  // total padded length in 32-bit words: data + 0x80 byte + zero pad, ending with two words of length
  const numWords = (((bytes.length + 8) >>> 6) + 1) * 16;
  const words = new Array(numWords).fill(0);

  for (let i = 0; i < bytes.length; i++) {
    words[i >> 2] |= bytes[i] << ((i % 4) * 8);
  }

  words[bytes.length >> 2] |= 0x80 << ((bytes.length % 4) * 8);
  words[numWords - 2] = bitLength | 0;
  words[numWords - 1] = Math.floor(bitLength / 0x100000000);

  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;

  for (let i = 0; i < words.length; i += 16) {
    const aa = a, bb = b, cc = c, dd = d;

    a = md5_ff(a, b, c, d, words[i + 0], 7, -680876936);
    d = md5_ff(d, a, b, c, words[i + 1], 12, -389564586);
    c = md5_ff(c, d, a, b, words[i + 2], 17, 606105819);
    b = md5_ff(b, c, d, a, words[i + 3], 22, -1044525330);
    a = md5_ff(a, b, c, d, words[i + 4], 7, -176418897);
    d = md5_ff(d, a, b, c, words[i + 5], 12, 1200080426);
    c = md5_ff(c, d, a, b, words[i + 6], 17, -1473231341);
    b = md5_ff(b, c, d, a, words[i + 7], 22, -45705983);
    a = md5_ff(a, b, c, d, words[i + 8], 7, 1770035416);
    d = md5_ff(d, a, b, c, words[i + 9], 12, -1958414417);
    c = md5_ff(c, d, a, b, words[i + 10], 17, -42063);
    b = md5_ff(b, c, d, a, words[i + 11], 22, -1990404162);
    a = md5_ff(a, b, c, d, words[i + 12], 7, 1804603682);
    d = md5_ff(d, a, b, c, words[i + 13], 12, -40341101);
    c = md5_ff(c, d, a, b, words[i + 14], 17, -1502002290);
    b = md5_ff(b, c, d, a, words[i + 15], 22, 1236535329);

    a = md5_gg(a, b, c, d, words[i + 1], 5, -165796510);
    d = md5_gg(d, a, b, c, words[i + 6], 9, -1069501632);
    c = md5_gg(c, d, a, b, words[i + 11], 14, 643717713);
    b = md5_gg(b, c, d, a, words[i + 0], 20, -373897302);
    a = md5_gg(a, b, c, d, words[i + 5], 5, -701558691);
    d = md5_gg(d, a, b, c, words[i + 10], 9, 38016083);
    c = md5_gg(c, d, a, b, words[i + 15], 14, -660478335);
    b = md5_gg(b, c, d, a, words[i + 4], 20, -405537848);
    a = md5_gg(a, b, c, d, words[i + 9], 5, 568446438);
    d = md5_gg(d, a, b, c, words[i + 14], 9, -1019803690);
    c = md5_gg(c, d, a, b, words[i + 3], 14, -187363961);
    b = md5_gg(b, c, d, a, words[i + 8], 20, 1163531501);
    a = md5_gg(a, b, c, d, words[i + 13], 5, -1444681467);
    d = md5_gg(d, a, b, c, words[i + 2], 9, -51403784);
    c = md5_gg(c, d, a, b, words[i + 7], 14, 1735328473);
    b = md5_gg(b, c, d, a, words[i + 12], 20, -1926607734);

    a = md5_hh(a, b, c, d, words[i + 5], 4, -378558);
    d = md5_hh(d, a, b, c, words[i + 8], 11, -2022574463);
    c = md5_hh(c, d, a, b, words[i + 11], 16, 1839030562);
    b = md5_hh(b, c, d, a, words[i + 14], 23, -35309556);
    a = md5_hh(a, b, c, d, words[i + 1], 4, -1530992060);
    d = md5_hh(d, a, b, c, words[i + 4], 11, 1272893353);
    c = md5_hh(c, d, a, b, words[i + 7], 16, -155497632);
    b = md5_hh(b, c, d, a, words[i + 10], 23, -1094730640);
    a = md5_hh(a, b, c, d, words[i + 13], 4, 681279174);
    d = md5_hh(d, a, b, c, words[i + 0], 11, -358537222);
    c = md5_hh(c, d, a, b, words[i + 3], 16, -722521979);
    b = md5_hh(b, c, d, a, words[i + 6], 23, 76029189);
    a = md5_hh(a, b, c, d, words[i + 9], 4, -640364487);
    d = md5_hh(d, a, b, c, words[i + 12], 11, -421815835);
    c = md5_hh(c, d, a, b, words[i + 15], 16, 530742520);
    b = md5_hh(b, c, d, a, words[i + 2], 23, -995338651);

    a = md5_ii(a, b, c, d, words[i + 0], 6, -198630844);
    d = md5_ii(d, a, b, c, words[i + 7], 10, 1126891415);
    c = md5_ii(c, d, a, b, words[i + 14], 15, -1416354905);
    b = md5_ii(b, c, d, a, words[i + 5], 21, -57434055);
    a = md5_ii(a, b, c, d, words[i + 12], 6, 1700485571);
    d = md5_ii(d, a, b, c, words[i + 3], 10, -1894986606);
    c = md5_ii(c, d, a, b, words[i + 10], 15, -1051523);
    b = md5_ii(b, c, d, a, words[i + 1], 21, -2054922799);
    a = md5_ii(a, b, c, d, words[i + 8], 6, 1873313359);
    d = md5_ii(d, a, b, c, words[i + 15], 10, -30611744);
    c = md5_ii(c, d, a, b, words[i + 6], 15, -1560198380);
    b = md5_ii(b, c, d, a, words[i + 13], 21, 1309151649);
    a = md5_ii(a, b, c, d, words[i + 4], 6, -145523070);
    d = md5_ii(d, a, b, c, words[i + 11], 10, -1120210379);
    c = md5_ii(c, d, a, b, words[i + 2], 15, 718787259);
    b = md5_ii(b, c, d, a, words[i + 9], 21, -343485551);

    a = (a + aa) | 0;
    b = (b + bb) | 0;
    c = (c + cc) | 0;
    d = (d + dd) | 0;
  }

  return wordsToHex([a, b, c, d]);
}

function md5cmn(q, a, b, x, s, t) {
  a = (a + q + x + t) | 0;
  return (((a << s) | (a >>> (32 - s))) + b) | 0;
}
function md5_ff(a, b, c, d, x, s, t) { return md5cmn((b & c) | (~b & d), a, b, x, s, t); }
function md5_gg(a, b, c, d, x, s, t) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t); }
function md5_hh(a, b, c, d, x, s, t) { return md5cmn(b ^ c ^ d, a, b, x, s, t); }
function md5_ii(a, b, c, d, x, s, t) { return md5cmn(c ^ (b | ~d), a, b, x, s, t); }

function wordsToHex(words) {
  const hexChars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < words.length * 4; i++) {
    const b = (words[i >> 2] >>> ((i % 4) * 8)) & 0xff;
    out += hexChars.charAt((b >>> 4) & 0x0f) + hexChars.charAt(b & 0x0f);
  }
  return out;
}
