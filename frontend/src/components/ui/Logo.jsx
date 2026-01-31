import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

const Logo = ({ size = 'h-8', showText = true, className = '' }) => {
  return (
    <Link to="/" className={`flex items-center ${className}`}>
      <img src={logo} alt="Maryland Pharmacy" className={`${size} w-auto`} />
      {showText && (
        <span className="ml-3 text-2xl font-bold text-gray-800 dark:text-white">
          Maryland
        </span>
      )}
    </Link>
  );
};

export default Logo;
