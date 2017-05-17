// @flow
import React from 'react';
import classNames from 'classnames';
import R from 'ramda';
import VideoHolder from '../../../Common/VideoHolder';
import './FanBody.css';
import defaultImg from '../../../../images/TAB_VIDEO_PREVIEW_LS.jpg';

const userTypes: ParticipantType[] = ['host', 'celebrity', 'fan'];

type Props = {
  isClosed: boolean,
  isLive: boolean,
  image?: string,
  participants: BroadcastParticipants,
  hasStreams: boolean,
  backstageConnected: boolean,
  fanStatus: FanStatus
};
const FanBody = (props: Props): ReactComponent => {
  const { isClosed, isLive, image, participants = {}, hasStreams, backstageConnected, fanStatus } = props;
  const fanOnStage = R.equals('stage', fanStatus);
  const showImage = (!isLive || !hasStreams) && !fanOnStage;
  const fanBodyClasses = classNames('FanBody');
  const hidePublisher = !backstageConnected || fanOnStage;
  const shouldSubscribe = isLive || fanOnStage;
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
          connected={(participants[type] && participants[type].connected && shouldSubscribe) || (fanOnStage && type === 'fan')}
          userType={type}
        />)}
      <div className={classNames('VideoWrap', 'smallVideo', { hide: hidePublisher })} id="videobackstageFan" />
      <div id="videoproducer" className="producerContainer" />
    </div>
  );
};

export default FanBody;
