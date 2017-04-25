// @flow
import React from 'react';
import VideoHolder from './VideoHolder';
import './CelebrityHostBody.css';
import defaultImg from '../../../images/TAB_VIDEO_PREVIEW_LS.jpg';

const userTypes = ['host', 'celebrity', 'fan'];

const CelebrityHostBody = (props: Props): ReactComponent => {
  const { status, endImage, participants } = props;
  return (
    <div className="CelebrityHostBody">
      { status === 'closed' &&
        <div className="closeImageHolder">
          <img src={endImage || defaultImg} alt="event ended" className="closeImage" />
        </div>
      }
      { status !== 'closed' && userTypes.map((userType: string): ReactComponent =>
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
