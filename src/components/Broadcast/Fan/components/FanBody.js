// @flow
import React from 'react';
import classNames from 'classnames';
import VideoHolder from '../../../Common/VideoHolder';
import './FanBody.css';
import defaultImg from '../../../../images/TAB_VIDEO_PREVIEW_LS.jpg';

const userTypes: ParticipantType[] = ['host', 'celebrity', 'fan'];

type Props = {
  isClosed: boolean,
  isLive: boolean,
  image?: string,
  participants: BroadcastParticipants,
  showImage: boolean,
  hasStreams: boolean
};
const FanBody = (props: Props): ReactComponent => {
  const { isClosed, isLive, image, participants, showImage, hasStreams } = props;
  console.log('fan body props', props);
  const imgClass = classNames('FanBody', { withStreams: hasStreams && isLive });
  return (
    <div className={imgClass}>
      { showImage &&
        <div className="imageHolder">
          <img src={image || defaultImg} alt="event" />
        </div>
      }
      { !isClosed && userTypes.map((type: ParticipantType): ReactComponent =>
        <VideoHolder
          key={`videoStream${type}`}
          connected={participants && isLive ? participants[type].connected : false}
          userType={type}
        />)}
    </div>
  );
};

export default FanBody;
