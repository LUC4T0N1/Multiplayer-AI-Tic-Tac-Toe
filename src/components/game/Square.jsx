import React from "react";
import "./Game.css";
import { ThemeContext } from "../../infrastructure/context";
import { useContext } from "react";

function Square({ chooseSquare, val }) {
  const theme =  useContext(ThemeContext);
  return (
    <div className={val==='X'?"square-x" : "square-o" } style={{ color: theme.state.darkMode ?   "black" : "white", boxShadow: theme.state.darkMode ? "0 0 9px #f7f7f7, 0 0 9px #ffffff, 0 0 9px #ffffff" : "0 0 9px #000000, 0 0 9px #080000, 0 0 9px #000000" }} onClick={chooseSquare}>
      {val}
    </div>
  );
}

export default Square;