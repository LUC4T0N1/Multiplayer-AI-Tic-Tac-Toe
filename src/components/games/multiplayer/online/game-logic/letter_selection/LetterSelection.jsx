import React from 'react'
import "./LetterSelection.css";
function LetterSelection({handleXSelection, xIsSelected, handleOSelection, oIsSelected}) {
  return (
    <div className='letter-selection'>
        <p>Choose your side</p>
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