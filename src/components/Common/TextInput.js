// @flow
import React from 'react';
import R from 'ramda';
import classNames from 'classnames';
import { properCase } from '../../services/util';

type Props = {
  type: string,
  value: string,
  name?: string,
  error: boolean,
  handleChange: (string, SyntheticInputEvent) => void,
  disabled?: boolean
};

const TextInput = ({ type, value, name, error, disabled, handleChange }: Props): ReactComponent =>
  <input
    type={type}
    name={name || type}
    value={value}
    placeholder={properCase(name || type)}
    onChange={R.partial(handleChange, [type])}
    className={classNames({ error })}
    disabled={disabled}
  />;

export default TextInput;
