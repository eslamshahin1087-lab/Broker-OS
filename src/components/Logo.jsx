import React from 'react';
import logo from '../assets/logo.png';

const Logo = ({ width = 150 }) => {
  return (
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      <img src={logo} alt="Broker-OS Logo" style={{ width }} />
    </div>
  );
};

export default Logo;