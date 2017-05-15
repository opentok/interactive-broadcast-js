// @flow
import React from 'react';
import classNames from 'classnames';
import R from 'ramda';
import './CelebrityHostHeader.css';

type Props = {
  userType: 'host' | 'celebrity',
  name: string,
  status: EventStatus,
  togglePublishOnly: boolean => void,
  publishOnlyEnabled: boolean,
  inPrivateCall: null | ParticipantType // eslint-disable-line react/no-unused-prop-types
};
const CelebrityHostHeader = (props: Props): ReactComponent => {
  const { userType, name, status, togglePublishOnly, publishOnlyEnabled } = props;
  const btnClass = classNames('btn action', { red: !publishOnlyEnabled }, { green: publishOnlyEnabled });
  const inPrivateCall = R.equals(userType, R.prop('inPrivateCall', props));
  return (
    <div className="CelebrityHostHeader">
      <div className="CelebrityHostHeader-main">
        <div>
          <h4>{name}<sup>{status === 'notStarted' ? 'NOT STARTED' : status}</sup></h4>
          { status !== 'closed' &&
            <div>
              <button className={btnClass} onClick={togglePublishOnly}>PUBLISH ONLY {publishOnlyEnabled ? 'ON' : 'OFF'}</button>
            </div>
          }
        </div>
        <div className="user-role">
          {userType}
        </div>
      </div>
      <div className={classNames('CelebrityHostHeader-private-call', { active: !!inPrivateCall })}>
        You are in a private call with the Producer
      </div>
    </div>
  );
};

export default CelebrityHostHeader;
