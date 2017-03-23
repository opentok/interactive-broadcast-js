// @flow
import React from 'react';
import ClipboardCopy from 'react-copy-to-clipboard';

type Props = {
  text: string,
  onAfterCopy: Unit
};

const CopyToClipboard = ({ text, onAfterCopy }: Props): ReactComponent =>
  <ClipboardCopy
    text={text}
    onCopy={onAfterCopy} >
    <button className="btn btn-light right-rounded">Copy Url</button>
  </ClipboardCopy>;

export default CopyToClipboard;
