import React from 'react'
import "./LetterSelection.css";
import {useTranslation} from 'react-i18next';

function LetterSelection({handleXSelection, xIsSelected, handleOSelection, oIsSelected}) {
  const {t} = useTranslation()
  return (
    <div className='letter-selection'>
        <p>{t('choose-side')}</p>
      <div className='container'>
        <button className={ (xIsSelected.selected === true) ? 'option' : 'option-selected'} onClick={() => handleXSelection()}>
            X
        </button>
        <button className={(oIsSelected.selected === true) ? 'option' : 'option-selected'} onClick={() => handleOSelection()}>
            O
        </button>
      </div>
    </div>
  )
}

export default LetterSelection