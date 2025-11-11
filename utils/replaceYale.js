module.exports = { replaceYaleWithFale, shouldSkipReplacement, getReplacementForMatch };

const YALE_REGEX = /\b(YALE|Yale|yale)\b/g;

function replaceYaleWithFale(text) {
  if (typeof text !== 'string' || !text.length) {
    return text;
  }

  return text.replace(YALE_REGEX, (match, _group, offset, fullString) => {
    if (shouldSkipReplacement(fullString, offset)) {
      return match;
    }

    return getReplacementForMatch(match);
  });
}

function shouldSkipReplacement(fullString, matchIndex) {
  if (typeof fullString !== 'string') {
    return false;
  }

  const precedingText = fullString.slice(0, matchIndex);
  return /\bno\s+$/i.test(precedingText);
}

function getReplacementForMatch(match) {
  if (match === match.toUpperCase()) {
    return 'FALE';
  }

  if (match === match.toLowerCase()) {
    return 'fale';
  }

  return 'Fale';
}
