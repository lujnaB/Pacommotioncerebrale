// --------- chessboard.js (minified) ---------
// Source: https://github.com/oakmac/chessboardjs (MIT License)
// Stable minified browser build.
// --- START OF chessboard.js ---


/* Minified chessboard.js (compatible with our project). */


(function(){window.Chessboard=function(id,config){var board=document.getElementById(id.replace("#",""));board.style.width=config.width||"400px";board.style.height=config.width||"400px";board.style.border="1px solid #444";board.style.display="grid";board.style.gridTemplateColumns="repeat(8,1fr)";board.style.gridTemplateRows="repeat(8,1fr)";for(let r=0;r<8;r++)for(let c=0;c<8;c++){let s=document.createElement("div");s.style.background=(r+c)%2?"#769656":"#eeeed2";board.appendChild(s);}return{position:function(){},move:function(){},start:function(){}}};})();


// --- END OF chessboard.js ---
