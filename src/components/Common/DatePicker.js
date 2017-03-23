// @flow
import React, { Component } from 'react';
import moment from 'moment';
import Datetime from 'react-datetime';
import './DatePicker.css';

type Props = {
  name: string,
  value: string,
  onChange: Unit
};

class DatePicker extends Component {
  props: Props;
  handleChange: moment => void;
  constructor(props: Props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }
  handleChange(m: moment) {
    const { onChange, name } = this.props;
    onChange({ target: { name, value: m.format('MM/DD/YYYY hh:mm:ss a') } });
  }

  render(): ReactComponent {
    const { name, value } = this.props;
    const { handleChange } = this;
    return <Datetime dateFormat="MMMM DD, YYYY" timeFormat="hh:mm A" name={name} onChange={handleChange} value={moment(new Date(value))} />;
  }
}

export default DatePicker;
