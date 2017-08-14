// @flow
import React from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
import classNames from 'classnames';
import Icon from 'react-fontawesome';
import CopyToClipboard from '../../../Common/CopyToClipboard';
import createUrls from '../../../../services/eventUrls';
import { isFan } from '../../../../services/util';
import ControlIcon from './ControlIcon';
import { toggleParticipantProperty } from '../../../../actions/broadcast';
import { connectPrivateCall, chatWithParticipant, sendToStage, kickFanFromFeed } from '../../../../actions/producer';
import './Participant.css';

const isBackstageFan = R.equals('backstageFan');
const isOnStageFan = R.equals('fan');
const getHeaderLabel = (type: ParticipantType): string => R.toUpper(isBackstageFan(type) ? 'backstage fan' : type);

type OwnProps = {
  type: ParticipantType
};

type BaseProps = {
  broadcast: BroadcastState,
  fanRecord: ActiveFan | null
};

type DispatchProps = {
  toggleAudio: Unit,
  toggleVideo: Unit,
  toggleVolume: Unit,
  privateCall: Unit,
  chat: Unit,
  kickFan: Unit,
  sendFanToStage: Unit
};

type Props = OwnProps & BaseProps & DispatchProps;

const Participant = (props: Props): ReactComponent => {
  const { type, toggleAudio, toggleVideo, toggleVolume, privateCall, chat, kickFan, broadcast, sendFanToStage, fanRecord } = props;
  const fanId = R.prop('id', fanRecord || {});
  const url = R.prop(`${type}Url`, createUrls(broadcast.event || {}));
  const me = R.prop(type, broadcast.participants) || {};
  const stageCountdown = broadcast.stageCountdown;
  const inPrivateCall = R.pathEq(['privateCall', 'isWith'], type, broadcast);
  const availableForPrivateCall = (): boolean => {
    const inPreshow = R.pathEq(['event', 'status'], 'preshow', broadcast);
    return (me.connected && (inPreshow || isBackstageFan(type)));
  };
  const statusIconClass = classNames('icon', { green: me.connected });
  const controlIconClass = classNames('icon', { active: me.connected });
  const volumeIconDisabled = (!inPrivateCall && isBackstageFan(type)) || !me.connected;
  const volumeIconClass = classNames('icon', { active: !volumeIconDisabled });
  const privateCallIconClass = classNames('icon', { active: me.connected && availableForPrivateCall() });
  const status = me.connected ? 'Online' : 'Offline';
  return (
    <div className="Participant">
      <div className="Participant-header">
        <span className="label" >{ getHeaderLabel(type) } </span>
        <span><Icon className={statusIconClass} name="circle" />{status}</span>
      </div>
      <div className="Participant-video" id={`video${type}`}>
        { !me.audio && me.connected && <div className="Participant-muted">MUTED</div> }
        { isOnStageFan(type) && stageCountdown >= 0 &&
          <div className="countdown-overlay">
            <span className="countdown-text">{stageCountdown}</span>
          </div>
        }
      </div>
      { isBackstageFan(type) ?
        <div className="Participant-move-fan">
          <button className="move btn transparent" onClick={sendFanToStage}>Move to fan feed</button>
        </div> :
        <div className="Participant-url">
          <span className="url">{ url }</span>
          <CopyToClipboard text={url} onCopyText="URL">
            <button className="btn white">COPY</button>
          </CopyToClipboard >
        </div>
      }
      <div className="Participant-feed-controls">
        <span className="label">Alter Feed</span>
        <div className="controls">
          <ControlIcon
            name={me.volume === 100 ? 'volume-up' : 'volume-down'}
            className={volumeIconClass}
            disabled={volumeIconDisabled}
            onClick={toggleVolume}
          />
          <ControlIcon
            name={inPrivateCall ? 'phone-square' : 'phone'}
            className={privateCallIconClass}
            disabled={!availableForPrivateCall()}
            onClick={R.partial(privateCall, [fanId])}
          />
          <ControlIcon
            name={me.audio ? 'microphone' : 'microphone-slash'}
            disabled={!me.connected}
            className={controlIconClass}
            onClick={toggleAudio}
          />
          <ControlIcon
            name="video-camera"
            className={controlIconClass}
            onClick={toggleVideo}
            disabled={!me.connected}
          />
          { R.contains('fan', R.toLower(type)) ?
            <ControlIcon name="ban" className={controlIconClass} onClick={kickFan} disabled={!me.connected} /> :
            <ControlIcon name="comment" onClick={chat} className={controlIconClass} disabled={!me.connected} />
          }
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state: State, ownProps: OwnProps): BaseProps => ({
  broadcast: R.prop('broadcast', state),
  fanRecord: isFan(ownProps.type) ? R.path(['broadcast', 'participants', ownProps.type, 'record'], state) : null,
});

const mapDispatchToProps: MapDispatchWithOwn<DispatchProps, OwnProps> = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
  toggleAudio: (): void => dispatch(toggleParticipantProperty(ownProps.type, 'audio')),
  toggleVideo: (): void => dispatch(toggleParticipantProperty(ownProps.type, 'video')),
  toggleVolume: (): void => dispatch(toggleParticipantProperty(ownProps.type, 'volume')),
  privateCall: (fanId?: UserId): void => dispatch(connectPrivateCall(ownProps.type, fanId)),
  kickFan: (): void => dispatch(kickFanFromFeed(ownProps.type)),
  chat: (): void => dispatch(chatWithParticipant(ownProps.type)),
  sendFanToStage: (): void => dispatch(sendToStage()),
});


export default connect(mapStateToProps, mapDispatchToProps)(Participant);
