import "./Languages.css"
import Globe from "../../assets/img/globe.png";
import i18n from "i18next";
import { useState } from "react";

const Languages = () => {

  const [isClicked, setisClicked] = useState(false);

  const languages = [
    {
      code: 'pt',
      name: 'Portugês',
      country_code: 'br'
    },
    {
      code: 'en',
      name: 'English',
      country_code: 'gb'
    }
  ]

  return (
    <div className="dropdown">
      <button className="d-button" onClick={() => setisClicked(!isClicked)}><img src={Globe} alt="" className="d-icon"/></button>
      {isClicked ? (
              <ul className="dropdown-content">
              {languages.map(({code, name, country_code}) => (
                <li key = {country_code}>
                  <button className="dropdown-item" onClick={() => i18n.changeLanguage(code)}>
                     <span className={`flag-icon flag-icon-${country_code}`}></span> 
                    {name}
                  </button>
                </li>
              ))}
            </ul>
            ) : (
              null
            )}
      
  </div>
  )
}

export default Languages