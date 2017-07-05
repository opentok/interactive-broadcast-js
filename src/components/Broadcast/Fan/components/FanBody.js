// @flow
import React from 'react';
import classNames from 'classnames';
import R from 'ramda';
import VideoHolder from '../../../Common/VideoHolder';
import FanHLSPlayer from './FanHLSPlayer';
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
  fanStatus: FanStatus,
  ableToJoin: boolean,
  hlsUrl: string,
  postProduction: boolean
};
const FanBody = (props: Props): ReactComponent => {
  const { isClosed, isLive, image, participants, hasStreams, backstageConnected, fanStatus, ableToJoin, hlsUrl, postProduction } = props;
  const fanOnStage = R.equals('stage', fanStatus);
  const showImage = ((!isLive && !postProduction) || (!hasStreams && ableToJoin)) && !fanOnStage;
  const hidePublisher = !backstageConnected || fanOnStage;
  const shouldSubscribe = isLive || fanOnStage || postProduction;
  const showHLSPlayer = isLive && !ableToJoin && hlsUrl;
  const isInLine = fanStatus !== 'disconnected' && fanStatus !== 'connected';
  const mainClassNames = classNames('FanBody', { inLine: isInLine });
  return (
    <div className={mainClassNames}>
      { showImage &&
        <div className="imageHolder">
          <img src={image || defaultImg} alt="event" />
        </div>
      }
      { !isClosed &&
      userTypes.map((type: ParticipantType): ReactComponent =>
        <VideoHolder
          key={`videoStream${type}`}
          connected={(!!participants[type] && participants[type].connected && shouldSubscribe) || (fanOnStage && type === 'fan')}
          userType={type}
        />)
      }
      { showHLSPlayer && <FanHLSPlayer isLive={isLive} hlsUrl={hlsUrl} /> }
      <div className={classNames('VideoWrap', 'smallVideo', { hide: hidePublisher })} id="videobackstageFan" />
      <div id="videoproducer" className="producerContainer" />
    </div>
  );
};

export default FanBody;
