// @flow
import React from 'react';
import classNames from 'classnames';
import VideoHolder from '../../../Common/VideoHolder';
import './FanBody.css';
import defaultImg from '../../../../images/TAB_VIDEO_PREVIEW_LS.jpg';

const userTypes = ['host', 'celebrity', 'fan'];

const FanBody = (props: Props): ReactComponent => {
  const { isClosed, isLive, image, participants, showImage, hasStreams } = props;
  const imgClass = classNames('FanBody', { withStreams: hasStreams && isLive });
  return (
    <div className={imgClass}>
      { showImage &&
        <div className="imageHolder">
          <img src={image || defaultImg} alt="event" />
        </div>
      }
      { !isClosed && userTypes.map((userType: string): ReactComponent =>
        <VideoHolder
          key={`videoStream${userType}`}
          connected={participants && isLive ? participants[userType].connected : false}
          userType={userType}
        />)}
    </div>
  );
};

export default FanBody;
