import React from 'react';
import R from 'ramda';
import classNames from 'classnames';

type Props = {
  showing: string,
  toggle: 'all' | 'current' | 'archived' => void
};

const ToggleEvents = ({ toggle, showing }: Props): ReactComponent =>
  <div className="toggle-events">
    <button className={classNames('btn', { transparent: showing !== 'all' })} onClick={R.partial(toggle, ['all'])}>
      All Events
    </button>
    <button className={classNames('btn', { transparent: showing !== 'current' })} onClick={R.partial(toggle, ['current'])}>
      Current Events
    </button>
    <button className={classNames('btn', { transparent: showing !== 'archived' })} onClick={R.partial(toggle, ['archived'])}>
      Archived Events
    </button>
  </div>;

export default ToggleEvents;

