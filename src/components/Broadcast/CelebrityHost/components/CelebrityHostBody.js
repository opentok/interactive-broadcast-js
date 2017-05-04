// @flow
import React from 'react';
import classNames from 'classnames';
import VideoHolder from '../../../Common/VideoHolder';
import './CelebrityHostBody.css';
import defaultImg from '../../../../images/TAB_VIDEO_PREVIEW_LS.jpg';

const userTypes: ParticipantType[] = ['host', 'celebrity', 'fan'];

type Props = {
  status: EventStatus,
  endImage?: string,
  participants: null | BroadcastParticipants, // publishOnly => null
  userType: 'host' | 'celebrity'
};
const CelebrityHostBody = (props: Props): ReactComponent => {
  const { status, endImage, participants, userType } = props;
  const isClosed = status === 'closed';
  const imgClass = classNames('CelebrityHostBody', { withStreams: !isClosed });
  return (
    <div className={imgClass}>
      { isClosed &&
        <div className="closeImageHolder">
          <img src={endImage || defaultImg} alt="event ended" className="closeImage" />
        </div>
      }
      { !isClosed && userTypes.map((type: ParticipantType): ReactComponent =>
        <VideoHolder
          key={`videoStream${type}`}
          connected={participants && participants[type] ? participants[type].connected : false}
          isMe={userType === type}
          userType={type}
        />)}
    </div>
  );
};

export default CelebrityHostBody;
