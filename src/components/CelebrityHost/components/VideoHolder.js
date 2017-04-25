// @flow
import React from 'react';
import classNames from 'classnames';

const VideoHolder = ({ userType, connected, isMe }: Props): ReactComponent =>
  <div className={classNames('VideoWrap', { hide: !connected && !isMe })} id={`video${userType}`} />;

export default VideoHolder;
