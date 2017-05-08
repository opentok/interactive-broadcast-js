// @flow
import React from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
import classNames from 'classnames';
import Icon from 'react-fontawesome';
import CopyToClipboard from '../../../Common/CopyToClipboard';
import createUrls from '../../../../services/eventUrls';
import ControlIcon from './ControlIcon';
import { toggleParticipantProperty } from '../../../../actions/broadcast';
import './Participant.css';

const isBackstageFan = R.equals('backstageFan');
const getHeaderLabel = (type: ParticipantType): string =>
  R.toUpper(isBackstageFan(type) ? 'backstage fan' : type);

type BaseProps = {
  type: ParticpantType,
  broadcast: BroadcastState
};

type DispatchProps = {
  toggleAudio: () => void,
  toggleVideo: () => void,
  toggleVolume: () => void
};

type Props = BaseProps & DispatchProps;

const Participant = ({ type, broadcast, toggleAudio, toggleVideo, toggleVolume }: Props): ReactComponent => {
  const url = R.prop(`${type}Url`, createUrls(broadcast.event || {}));
  const me = R.prop(`${type}`, broadcast.participants) || {};
  const statusIconClass = classNames('icon', { green: me.connected });
  const controlIconClass = classNames('icon', { active: me.connected });
  const status = me.connected ? 'Online' : 'Offline';
  return (
    <div className="Participant">
      { !me.audio && me.connected && <div className="Participant-muted">MUTED</div> }
      <div className="Participant-header">
        <span className="label" >{ getHeaderLabel(type) } </span>
        <span><Icon className={statusIconClass} name="circle" />{status}</span>
      </div>
      <div className="Participant-video" id={`video${type}`} />

      { isBackstageFan(type) ?
        <div className="Participant-move-fan">
          <button className="move btn transparent">Move to fan feed</button>
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
          <ControlIcon name={me.volume === 100 ? 'volume-up' : 'volume-down'} className={controlIconClass} disabled={!me.connected} onClick={toggleVolume} />
          <ControlIcon name="phone" className={controlIconClass} disabled={!me.connected} />
          <ControlIcon name={me.audio ? 'microphone' : 'microphone-slash'} disabled={!me.connected} className={controlIconClass} onClick={toggleAudio} />
          <ControlIcon name="video-camera" className={controlIconClass} onClick={toggleVideo} disabled={!me.connected} />
          { R.contains('fan', R.toLower(type)) ?
            <ControlIcon name="ban" className={controlIconClass} disabled={!me.connected} /> :
            <ControlIcon name="comment" className={controlIconClass} disabled={!me.connected} />
          }
        </div>
      </div>
    </div>
  );
};

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch, ownProps: Props): DispatchProps =>
({
  toggleAudio: (): void => dispatch(toggleParticipantProperty(ownProps.type, 'audio')),
  toggleVideo: (): void => dispatch(toggleParticipantProperty(ownProps.type, 'video')),
  toggleVolume: (): void => dispatch(toggleParticipantProperty(ownProps.type, 'volume')),
});

const mapStateToProps = (state: State): BaseProps => (
  {
    broadcast: R.path(['broadcast'], state),
  }
);

export default connect(mapStateToProps, mapDispatchToProps)(Participant);
