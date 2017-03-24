import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router';
import moment from 'moment';
import { createBroadcastEvent, updateBroadcastEvent, getBroadcastEvents } from '../../actions/events';
import EventForm from './components/EventForm';
import './Event.css';

/* beautify preserve:start */
type InitialProps = { params: { id?: string } };
type BaseProps = {
  user: User,
  events: BroadcastEventMap,
  eventId: string
};
type DispatchProps = { loadEvents: Unit, createEvent: Unit, updateEvent: Unit };
type Props = InitialProps & BaseProps & DispatchProps;
/* beautify preserve:end */

class Event extends Component {
  props: Props;
  state: {
    errors: null | { fields: {
        [field: string]: string }, text: string },
    dateTimeSet: boolean
  };
  onUpdate: string => void;
  onSubmit: BroadcastEventFormData => void;
  validateAndFormat: BroadcastEventFormData => boolean;
  constructor(props: Props) {
    super(props);
    this.state = {
      errors: null,
      dateTimeSet: false,
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
    if (moment(data.dateTimeStart).isAfter(data.dateTimeEnd)) {
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
    // If the admin has not set the dates/times, omit them
    const initialFields = datesSet ? [] : ['dateTimeStart', 'dateTimeEnd'];
    const fieldsToOmit = R.reduce(omitIfEmpty, initialFields, R.keys(data));

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
      R.assoc('adminId', this.props.user.id),
      R.evolve(formatting),
      R.omit(R.append('fanAudioUrl', fieldsToOmit)) // eslint-disable-line comma-dangle
    )(data);
  }

  onSubmit(data: BroadcastEventFormData) {

    const formattedData = this.validateAndFormat(data);

    if (!formattedData) {
      return;
    }
    console.log(formattedData)

    if (R.isNil(R.path(['params', 'id'], this.props))) {
      this.props.createEvent(formattedData);
    } else {
      this.props.updateEvent(formattedData);
    }
  }

  render(): ReactComponent {
    const { onSubmit, onUpdate } = this;
    const { user, eventId } = this.props;
    const { errors } = this.state;
    const event = R.pathOr(null, ['events', eventId], this.props);
    return (
      <div className="Event">
        <div className="EventHeader admin-page-header">
          <Link to="admin">Back to Events</Link>
          <h3>{ eventId ? 'Edit Event' : 'Add New Event' }</h3>
        </div>
        <div className="admin-page-content">
          <EventForm event={event} user={user} errors={errors} onUpdate={onUpdate} onSubmit={onSubmit} />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: State, ownProps: initialProps): BaseProps => ({
  eventId: ownProps.params.id,
  events: state.events.map,
  user: state.currentUser,
});
const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    loadEvents: (userId: string, redirect: string) => {
      dispatch(getBroadcastEvents(userId, redirect));
    },
    createEvent: (data: object) => {
      dispatch(createBroadcastEvent(data));
    },
    updateEvent: (data: object) => {
      dispatch(updateBroadcastEvent(data));
    },
  });

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Event));
