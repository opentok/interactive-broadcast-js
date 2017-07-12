import R from 'ramda';
import { remove as removeDiacritics } from 'diacritics';
import Hashids from 'hashids';

// eslint-disable-next-line no-regex-spaces
const convertName = R.compose(R.replace(/ /g, '-'), R.toLower, R.replace(/  +/g, ' '), removeDiacritics, R.replace(/[^a-zA-Z0-9 ]/g, ''), R.trim);
const origin = (): string => window.location.origin;
const hashEventName = (name: string): string => R.isEmpty(name) ? '' : new Hashids(name).encode(1, 2, 3);

// We still need to return urls when no name is provided as it provides the base for the urls in the event form
const createUrls = ({ name, adminId }: { name?: string, adminId: string}): EventUrls => {
  if (!adminId) { return {}; }
  const base = origin();
  const eventName = convertName(name);
  const eventNameHash = hashEventName(eventName);
  return {
    fanUrl: `${base}/show/${adminId}/${eventName}`,
    fanAudioUrl: `${base}/post-production/${adminId}/${eventName}`,
    hostUrl: `${base}/show-host/${adminId}/${eventNameHash}`,
    celebrityUrl: `${base}/show-celebrity/${adminId}/${eventNameHash}`,
  };
};

export default createUrls;
