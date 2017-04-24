import React from 'react';
import Icon from 'react-fontawesome';

type Props = {
  className: Classes,
  name: string,
  onClick: Handler,
  disabled: boolean
};

const ControlIcon = ({ className, name, onClick, disabled = false }: Props): ReactComponent =>
  <button className="btn white control" disabled={disabled} onClick={onClick} >
    <Icon className={className} name={name} />
  </button>;

export default ControlIcon;
