// bot.js — logique du jeu + UI glue
defaultBotMove(level);
} else {
defaultBotMove(level);
}
}


// Basic evaluation function (material + small mobility)
function evaluateBoard(boardSnapshot){
const vals = {p:1,n:3,b:3,r:5,q:9,k:0};
let score = 0;
const fen = boardSnapshot.split(' ')[0];
const rows = fen.split('/');
for(const r of rows){
for(const ch of r){
if(/[0-9]/.test(ch)) continue;
const isUpper = ch === ch.toUpperCase();
const piece = ch.toLowerCase();
const v = vals[piece]||0;
score += (isUpper? v: -v);
}
}
return score;
}


// choose move by searching 2 plies with simple eval and randomness depending on level
function defaultBotMove(level){
const moves = game.moves();
if(moves.length === 0) return;


// generate candidate moves and evaluate resulting positions
const candidates = [];
for(const m of moves){
game.move(m);
const fen = game.fen();
const val = evaluateBoard(fen);
game.undo();
candidates.push({move:m,eval:val});
}


// depending on level, add noise when selecting move
// level small -> pick among top X with randomness
candidates.sort((a,b)=> (game.turn()==='w' ? b.eval - a.eval : a.eval - b.eval));


const topk = Math.max(1, Math.floor(candidates.length * Math.min(0.25 + level/40, 0.9)));
const pickIndex = Math.floor(Math.random() * topk);
const chosen = candidates[pickIndex].move;


game.move(chosen);
board.position(game.fen());
updateHistory();


// taunts
const taunts = [
"Voilà, simple et efficace. Contrairement à toi.",
"J'espère que t'as un plan. Moi j'en ai 12.",
"T’inquiète, tu t'amélioreras… un jour.",
"Oh intéressant… non je rigole.",
"Je pourrais jouer les yeux fermés là.",
"Allez, fais voir ce que t'as dans le ventre. Spoiler : pas grand-chose."
];
chat(taunts[Math.floor(Math.random()*taunts.length)]);


if(game.game_over()){
chat('Partie terminée. J'ai bien mangé ton roi.');
}
}


// tiny helper
function getRandomInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min }


// init board (uses Chessboard constructor from chessboard.js)
function init(){
// create an element that chessboard.js understands
const boardEl = document.getElementById('board');
// attach a very simple chessboard using chessboard.js
board = Chessboard(boardEl, {
draggable: true,
position: 'start',
onDragStart: onDragStart,
onDrop: onDrop,
onSnapEnd: onSnapEnd,
pieceTheme: function(piece){
// use simple Unicode piece images? chessboard.js expects image URLs — for simplicity use SVG data urls or fallback to text.
// For now rely on chessboard.js default images if present in the chessboard.js implementation used.
return '';
