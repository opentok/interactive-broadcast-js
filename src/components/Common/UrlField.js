// @flow
import React from 'react';
import CopyToClipboard from './CopyToClipboard';
import './UrlField.css';

type Props = {
  type: string,
  url: string,
  value: string,
  copy: string,
  labelTxt: string,
  onChange: Unit,
  onAfterCopy: Unit
};

const UrlField = ({ type, labelTxt, copy, url, value, onChange, onAfterCopy }: Props): ReactComponent =>
  <div className="UrlField form-group">
    <div className="label form-label">{labelTxt}</div>
    <div className="input-group copy-url">
      <span className="input left-rounded">{url}</span>
      <input type="text" className="input addon-white" name={type} onChange={onChange} value={value} />
      <CopyToClipboard text={copy} onAfterCopy={onAfterCopy} />
    </div>
  </div>;

export default UrlField;
