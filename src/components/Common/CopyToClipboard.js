// @flow
import React from 'react';
import Copy from 'react-copy-to-clipboard';
import R from 'ramda';
import { toastr } from 'react-redux-toastr';

type Props = {
  children?: ReactComponent[],
  text: string,
  onCopyText: string
};

const onCopy = (text: string): void => toastr.success('Success', `${text} copied to clipboard`, { icon: 'success' });

const CopyToClipboard = ({ children, text = '', onCopyText }: Props): ReactComponent =>
  <Copy text={text} onCopy={R.partial(onCopy, [onCopyText])}>
    { children }
  </Copy>;

export default CopyToClipboard;
