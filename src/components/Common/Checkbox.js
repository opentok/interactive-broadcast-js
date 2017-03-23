// @flow
import React from 'react';
import R from 'ramda';
import './Checkbox.css';

type Props = {
  type: string,
  value: string,
  labelTxt:string,
  checked:boolean,
  onClick: Unit
};

const Checkbox = ({ labelTxt, type, checked, onClick }: Props): ReactComponent =>
  <div className="checkbox checkbox-primary">
    <input
      onChange={R.partial(onClick, [type])}
      type="checkbox"
      name={type}
      checked={checked}/>
    <label>
      {labelTxt}
    </label>
  </div>;

export default Checkbox;
