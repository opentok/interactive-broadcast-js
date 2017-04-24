// @flow
import React from 'react';
import classNames from 'classnames';
import VideoHolder from './VideoHolder';
import './FanBody.css';
import defaultImg from '../../../images/TAB_VIDEO_PREVIEW_LS.jpg';

const userTypes = ['host', 'celebrity', 'fan'];

const FanBody = (props: Props): ReactComponent => {
  const { status, endImage, participants, totalStreams } = props;
  const VideoWrap = classNames('VideoWrap', `streams-${totalStreams}`);
  return (
    <div className="FanBody">
      { status === 'closed' &&
        <div className="closeImageHolder">
          <img src={endImage || defaultImg} alt="event ended" className="closeImage" />
        </div>
      }
      { status !== 'closed' && userTypes.map((userType: string): ReactComponent =>
        <VideoHolder
          key={`videoStream${userType}`}
          divClass={VideoWrap}
          connected={participants ? participants[userType].connected : false}
          isMe={props.userType === userType}
          userType={userType}
        />)}
    </div>
  );
};

export default FanBody;
