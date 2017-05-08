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
  hasStreams: boolean
};
const FanBody = (props: Props): ReactComponent => {
  const { isClosed, isLive, image, participants, hasStreams } = props;
  const showImage = !isLive || !hasStreams;
  const fanBodyClasses = classNames('FanBody', { showImage });
  return (
    <div className={fanBodyClasses}>
      { showImage &&
        <div className="imageHolder">
          <img src={image || defaultImg} alt="event" />
        </div>
      }
      { !isClosed && userTypes.map((type: ParticipantType): ReactComponent =>
        <VideoHolder
          key={`videoStream${type}`}
          connected={participants && participants[type] && isLive ? participants[type].connected : false}
          userType={type}
        />)}
    </div>
  );
};

export default FanBody;
