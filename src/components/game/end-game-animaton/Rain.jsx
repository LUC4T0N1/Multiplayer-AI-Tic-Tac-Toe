import React from 'react'
import "./Rain.css"
function Rain({winner}) {

  function rain(){
    let amount = 11;
/*     let body = document.querySelector('body')
 */    let i = 0;
    var drops = [];
    while(i<amount){

      let size =  Math.random() * 5;
      let posX = Math.floor(Math.random() * 95);
      let delay = Math.random() * - 20;
      let duration = Math.random() * 5;

      const mystyle = {
        width: 0.2 + size + 'px',
        left: posX + 'vw',
        animationDelay: delay + 's',
        animationDuration: 1 + duration + 's'
      };
      let drop = <i style={mystyle}>{winner}</i>
      drops.push(drop);
      i++;
    }
    return drops
  }
  return (
    <>
    {rain()}
    </>
  )
}

export default Rain