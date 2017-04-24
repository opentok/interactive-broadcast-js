// @flow
import React from 'react';
import classNames from 'classnames';

const VideoHolder = ({ userType, divClass, connected, isMe }: Props): ReactComponent =>
  <div className={classNames(divClass, { hide: !connected && !isMe })}>
    <div className="VideoWindow" id={`video${userType}`} />
  </div>;

export default VideoHolder;
