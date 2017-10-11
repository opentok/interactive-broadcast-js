// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router';
import moment from 'moment';
import { createBroadcastEvent, updateBroadcastEvent, getBroadcastEvents, displayNoApiKeyAlert } from '../../actions/events';
import EventForm from './components/EventForm';
import './UpdateEvent.css';

/* beautify preserve:start */
type InitialProps = { params: { id?: EventId } };
type BaseProps = {
  user: CurrentUserState,
  events: null | BroadcastEventMap,
  eventId: null | EventId
};
type DispatchProps = {
  loadEvents: UserId => void,
  createEvent: BroadcastEventFormData => void,
  updateEvent: BroadcastEventUpdateFormData => void,
  noApiKeyAlert: Unit
};
type Props = InitialProps & BaseProps & DispatchProps;
/* beautify preserve:end */

class UpdateEvent extends Component {
  props: Props;
  state: {
    errors: null | { fields: { [field: string]: boolean }, message: string },
    dateTimeSet: boolean
  };
  onUpdate: string => void;
  onSubmit: BroadcastEventFormData => void;
  validateAndFormat: BroadcastEventFormData => null | BroadcastEventFormData;
  constructor(props: Props) {
    super(props);
    this.state = {
      errors: null,
      dateTimeSet: false
    };
    this.validateAndFormat = this.validateAndFormat.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
  }
  componentDidMount() {
    const { user } = this.props;
    if (!this.props.events) {
      this.props.loadEvents(user.id);
    }
    if (!user.otApiKey) {
      this.props.noApiKeyAlert();
    }
  }

  onUpdate(field: string) {
    if (R.contains(field, ['dateTimeStart', 'dateTimeEnd'])) {
      this.setState({ dateTimeSet: true });
    }
    const errorFields = R.pathOr({}, ['errors', 'fields'], this.state);
    if (errorFields[field]) {
      this.setState({ errors: null });
    }
  }

  // TODO: Redirect URL validation
  validateAndFormat(data: BroadcastEventFormData): (null | BroadcastEventFormData) {

    // Ensure valid start and end times
    if (moment(new Date(data.dateTimeStart)).isAfter(new Date(data.dateTimeEnd))) {
      const errors = {
        fields: { dateTimeStart: true, dateTimeEnd: true },
        message: 'Start time cannot be after end time.',
      };
      this.setState({ errors });
      return null;
    }

    // Empty fields should not be included
    const datesSet = this.state.dateTimeSet;
    const omitIfEmpty = (acc: string[], field: string): string[] => R.isEmpty(data[field]) ? R.append(field, acc) : acc;
    // Omit start and end images if they are null
    const omitIfNull = (acc: string[], image: string): string[] => R.isNil(data[image]) ? R.append(image, acc) : acc;
    const emptyImageFields = R.reduce(omitIfNull, [], ['startImage', 'endImage']);
        // If the admin has not set the dates/times, omit them
    const initialFields = datesSet ? [] : ['dateTimeStart', 'dateTimeEnd'];
    const fieldsToOmit = R.concat(R.reduce(omitIfEmpty, initialFields, R.keys(data)), emptyImageFields);


    // Standard moment formatting for timestamps. Slugs only for urls.

    const editTimestamp = (t: string): (string) => moment(new Date(t)).format();
    const formatting = {
      name: R.compose(R.replace(/  +/g, ' '), R.trim), // eslint-disable-line no-regex-spaces
      dateTimeStart: editTimestamp,
      dateTimeEnd: editTimestamp,
      celebrityUrl: R.compose(R.last, R.split('/')),
      fanUrl: R.compose(R.last, R.split('/')),
      hostUrl: R.compose(R.last, R.split('/')),
    };

    return R.compose(
      R.assoc('adminId', R.path(['user', 'id'], this.props)),
      R.evolve(formatting),
      R.omit(R.append('fanAudioUrl', fieldsToOmit)) // eslint-disable-line comma-dangle
    )(data);
  }

  onSubmit(data: BroadcastEventFormData) {

    const formattedData = this.validateAndFormat(data);

    if (!formattedData) {
      return;
    }

    const eventId = R.path(['params', 'id'], this.props);
    if (R.isNil(eventId)) {
      this.props.createEvent(formattedData);
    } else {
      this.props.updateEvent(R.assoc('id', eventId, formattedData));
    }
  }

  render(): ReactComponent {
    const { onSubmit, onUpdate } = this;
    const { user, eventId } = this.props;
    const { errors } = this.state;
    const event = R.pathOr(null, ['events', eventId], this.props);
    return (
      <div className="UpdateEvent">
        <div className="UpdateEvent-header admin-page-header">
          <Link to="/admin">Back to Events</Link>
          <h3>{ eventId ? 'Edit Event' : 'Add New Event' }</h3>
        </div>
        <div className="admin-page-content">
          <EventForm event={event} user={user} errors={errors} onUpdate={onUpdate} onSubmit={onSubmit}/>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: State, ownProps: InitialProps): BaseProps => ({
  eventId: R.pathOr(null, ['params', 'id'], ownProps),
  events: R.path(['events', 'map'], state),
  user: state.currentUser,
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
  loadEvents: (userId: UserId) => {
    dispatch(getBroadcastEvents(userId));
  },
  createEvent: (data: BroadcastEventFormData) => {
    dispatch(createBroadcastEvent(data));
  },
  updateEvent: (data: BroadcastEventUpdateFormData) => {
    dispatch(updateBroadcastEvent(data));
  },
  noApiKeyAlert: () => {
    dispatch(displayNoApiKeyAlert());
  },
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(UpdateEvent));
