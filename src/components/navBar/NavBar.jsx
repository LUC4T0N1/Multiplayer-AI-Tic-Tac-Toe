import React from 'react'
import Toggle from '../toggle/Toggle'
import Languages from '../languages-drop-down/Languages'
import "./NavBar.css"
import {useTranslation} from 'react-i18next';
import { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faBars } from '@fortawesome/free-solid-svg-icons'
import { Link } from "react-router-dom";

function NavBar() {

  const [isMobile, setIsMobile] = useState(false);
  const {t} = useTranslation()
  
  return (
    <nav className="navbar">
      <div className="nav-menu" id="nav-menu">
        <ul className={isMobile? "nav-links-mobile" : "nav-links"}
        onClick={() => setIsMobile(false)}>
          <li className="nav-item">
            <Link className="nav-link" to="/">Home</Link>
          </li>
          <li className="nav-item">
            <a href="#about" className="nav-link">{t('nav_about')}</a>
          </li>
          <li className="nav-item">
            <a href="#exp" className="nav-link">{t('nav_exp')}</a>
          </li>
          <li className="nav-item">
            <a href="#skills" className="nav-link">{t('nav_skills')}</a>
          </li>
          <li className="nav-item">
            <a href="#projects" className="nav-link">{t('nav_projects')}</a>
          </li>
          <li className="nav-item" id="last">
            <a href="#contact" className="nav-link">{t('nav_contact')}</a>
          </li>
        </ul>
        <div>
          <button className="mobile-menu-icon"
          onClick={() => setIsMobile(!isMobile)}>
            {isMobile ? (
              <FontAwesomeIcon icon={faTimes} className='fas fa-times'></FontAwesomeIcon>
            ) : (
              <FontAwesomeIcon icon={faBars} className='fas fa-bars'></FontAwesomeIcon>
            )}
          </button>
        </div>
      </div>
      <Languages/>
      <Toggle/>
    </nav>
  )
}

export default NavBar