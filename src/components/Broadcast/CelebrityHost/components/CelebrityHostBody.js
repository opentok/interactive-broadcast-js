// @flow
import React from 'react';
import classNames from 'classnames';
import VideoHolder from '../../../Common/VideoHolder';
import './CelebrityHostBody.css';
import defaultImg from '../../../../images/TAB_VIDEO_PREVIEW_LS.jpg';

const userTypes = ['host', 'celebrity', 'fan'];

const CelebrityHostBody = (props: Props): ReactComponent => {
  const { status, endImage, participants } = props;
  const isClosed = status === 'closed';
  const imgClass = classNames('CelebrityHostBody', { withStreams: !isClosed });
  return (
    <div className={imgClass}>
      { isClosed &&
        <div className="closeImageHolder">
          <img src={endImage || defaultImg} alt="event ended" className="closeImage" />
        </div>
      }
      { !isClosed && userTypes.map((userType: string): ReactComponent =>
        <VideoHolder
          key={`videoStream${userType}`}
          connected={participants ? participants[userType].connected : false}
          isMe={props.userType === userType}
          userType={userType}
        />)}
    </div>
  );
};

export default CelebrityHostBody;
