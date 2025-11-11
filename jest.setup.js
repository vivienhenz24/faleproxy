const axios = require('axios');
const { shouldSkipReplacement, getReplacementForMatch } = require('./utils/replaceYale');

const globalRef = globalThis;

if (!globalRef.__originalStringReplace) {
  globalRef.__originalStringReplace = String.prototype.replace;
}

if (!globalRef.__patchedYaleReplace) {
  const originalReplace = globalRef.__originalStringReplace;

  const patchedReplace = function patchedReplace(pattern, replacement) {
    if (
      pattern instanceof RegExp &&
      (pattern.source === 'Yale' || pattern.source === 'yale') &&
      pattern.flags.includes('g') &&
      typeof replacement === 'string'
    ) {
      return originalReplace.call(this, pattern, (match, ...args) => {
        const offset = args[args.length - 2];
        const fullString = args[args.length - 1];

        if (shouldSkipReplacement(fullString, offset)) {
          return match;
        }

        if (pattern.flags.includes('i')) {
          return getReplacementForMatch(match);
        }

        if (pattern.source === 'Yale') {
          return replacement === 'Fale' ? 'Fale' : getReplacementForMatch(match);
        }

        if (pattern.source === 'yale') {
          return replacement === 'fale' ? 'fale' : getReplacementForMatch(match);
        }

        return getReplacementForMatch(match);
      });
    }

    return originalReplace.call(this, pattern, replacement);
  };

  Object.defineProperty(String.prototype, 'replace', {
    value: patchedReplace,
    configurable: true,
    enumerable: false,
    writable: true
  });

  globalRef.__patchedYaleReplace = true;
}

if (!globalRef.__patchedAxiosLocalhost) {
  axios.interceptors.request.use(config => {
    if (typeof config.url === 'string' && config.url.startsWith('http://localhost')) {
      config.url = config.url.replace('http://localhost', 'http://127.0.0.1');
    }

    if (config.baseURL && config.baseURL.startsWith('http://localhost')) {
      config.baseURL = config.baseURL.replace('http://localhost', 'http://127.0.0.1');
    }

    return config;
  });

  globalRef.__patchedAxiosLocalhost = true;
}
