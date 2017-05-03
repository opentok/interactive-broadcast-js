// @flow
import React from 'react';
import classNames from 'classnames';

type Props = { userType: ParticipantType, connected: boolean, isMe?: boolean };
const VideoHolder = ({ userType, connected, isMe }: Props): ReactComponent =>
  <div className={classNames('VideoWrap', { hide: !connected && !isMe })} id={`video${userType}`} />;

export default VideoHolder;
