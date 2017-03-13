// @flow
import React from 'react';
import R from 'ramda';
import classNames from 'classnames';
import { properCase } from '../../services/util';

type Props = {
  type: string,
  value: string,
  error: boolean,
  handleChange: Unit
};

const TextInput = ({ type, value, error, handleChange }: Props): ReactComponent =>
  <input
    type={type}
    name={type}
    value={value}
    placeholder={properCase(type)}
    onChange={R.partial(handleChange, [type])}
    className={classNames({ error })}
  />;

export default TextInput;
