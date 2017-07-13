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
  image?: EventImage,
  participants: BroadcastParticipants,
  hasStreams: boolean,
  backstageConnected: boolean,
  fanStatus: FanStatus,
  ableToJoin: boolean,
  hlsUrl: string,
  postProduction: boolean,
  publisherMinimized: boolean,
  restorePublisher: Unit,
  minimizePublisher: Unit
};

const FanBody = (props: Props): ReactComponent => {
  const {
    isClosed,
    isLive,
    image,
    participants,
    hasStreams,
    backstageConnected,
    fanStatus,
    ableToJoin,
    hlsUrl,
    postProduction,
    publisherMinimized,
    minimizePublisher,
    restorePublisher,
  } = props;
  const fanOnStage = R.equals('stage', fanStatus);
  const showImage = ((!isLive && !postProduction) || (!hasStreams && ableToJoin)) && !fanOnStage;
  const hidePublisher = isClosed || !backstageConnected || fanOnStage;
  const shouldSubscribe = isLive || fanOnStage || postProduction;
  const showHLSPlayer = isLive && !ableToJoin && hlsUrl;
  const isInLine = fanStatus !== 'disconnected' && fanStatus !== 'connected';
  const mainClassNames = classNames('FanBody', { inLine: isInLine });
  return (
    <div className={mainClassNames}>
      { showImage &&
        <div className="imageHolder">
          <img src={image ? image.url : defaultImg} alt="event" />
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
      <div className={classNames('publisherWrapper', { hidePublisher, minimized: publisherMinimized })}>
        <div className="publisherActions">
          { !publisherMinimized && <button onClick={minimizePublisher}><i className="fa fa-minus minimize" /></button> }
          { publisherMinimized && <button onClick={restorePublisher}><i className="fa fa-video-camera restore" /></button> }
        </div>
        <div className={classNames('VideoWrap', 'smallVideo', { hidePublisher: hidePublisher || publisherMinimized })} id="videobackstageFan" />
      </div>
      <div id="videoproducer" className="producerContainer" />
    </div>
  );
};

export default FanBody;
