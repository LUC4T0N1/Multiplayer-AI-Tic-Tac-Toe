import React from 'react'
import "./Rain.css"
import {useTranslation} from 'react-i18next';
function Rain({winner}) {
  const {t} = useTranslation()
  function rain(){
    let amount = 11;
    let i = 0;
    var drops = [];
    while(i<amount){

      let size =  Math.random() * 5;
      let posX ;
      if(i%2===0){
        posX = Math.floor((Math.random() * 26) + 70);
      }else{
        posX = Math.floor((Math.random() * 21) + 5);
      }
      let delay = Math.random() * - 20;
      let duration = Math.random() * 5;

      const mystyle = {
        width: 0.2 + size + 'px',
        left: posX + 'vw',
        animationDelay: delay + 's',
        animationDuration: 1 + duration + 's'
      };
      let drop
      if(winner==='X' || winner==='O'){
        drop = <i style={mystyle}>{winner}</i>
      }else{
        drop = <i style={mystyle}></i>
      }
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