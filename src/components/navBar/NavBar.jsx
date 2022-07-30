import React from 'react'
import Toggle from '../toggle/Toggle'
import Languages from '../languages-drop-down/Languages'
import "./NavBar.css"
import {useTranslation} from 'react-i18next';
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome } from '@fortawesome/free-solid-svg-icons'

function NavBar() {

  const {t} = useTranslation()
  
  return (
    <nav className="navbar">
      <div className="nav-menu" id="nav-menu">
        <ul className={"nav-links"}>
          <li className="nav-item">
            <Link className="nav-link" to="/">
            <FontAwesomeIcon icon={faHome} className='icon'></FontAwesomeIcon>
              </Link>
          </li>
        </ul>
      </div>
      <Languages/>
      <Toggle/>
    </nav>
  )
}

export default NavBar