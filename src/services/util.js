// @flow
import R from 'ramda';

const properCase = (input: string): string => `${R.toUpper(R.head(input))}${R.tail(input)}`;

module.exports = {
  properCase,
};
