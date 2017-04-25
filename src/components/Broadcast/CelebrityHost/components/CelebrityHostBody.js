// @flow
import React from 'react';
<<<<<<< HEAD:src/components/Broadcast/CelebrityHost/components/CelebrityHostBody.js
import VideoHolder from '../../../Common/VideoHolder';
=======
import VideoHolder from './VideoHolder';
>>>>>>> af6e9c96e4f0d949cb4be8c7b2b9124b50f4a49a:src/components/CelebrityHost/components/CelebrityHostBody.js
import './CelebrityHostBody.css';
import defaultImg from '../../../../images/TAB_VIDEO_PREVIEW_LS.jpg';

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
