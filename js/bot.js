// Moteur d'échecs simple intégré
class SimpleChess {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.board = this.createInitialBoard();
    this.turn = 'w';
    this.history = [];
    this.moveCount = 1;
  }
  
  createInitialBoard() {
    return [
      ['bR','bN','bB','bQ','bK','bB','bN','bR'],
      ['bP','bP','bP','bP','bP','bP','bP','bP'],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      ['wP','wP','wP','wP','wP','wP','wP','wP'],
      ['wR','wN','wB','wQ','wK','wB','wN','wR']
    ];
  }
  
  getBoard() {
    return this.board;
  }
  
  getPiece(square) {
    const [file, rank] = this.squareToCoords(square);
    return this.board[rank][file];
  }
  
  squareToCoords(square) {
    const file = square.charCodeAt(0) - 97;
    const rank = 8 - parseInt(square[1]);
    return [file, rank];
  }
  
  coordsToSquare(file, rank) {
    return String.fromCharCode(97 + file) + (8 - rank);
  }
  
  isValidMove(from, to) {
    const [fromFile, fromRank] = this.squareToCoords(from);
    const [toFile, toRank] = this.squareToCoords(to);
    
    const piece = this.board[fromRank][fromFile];
    if (!piece || piece[0] !== this.turn) return false;
    
    const targetPiece = this.board[toRank][toFile];
    if (targetPiece && targetPiece[0] === this.turn) return false;
    
    const type = piece[1];
    const df = Math.abs(toFile - fromFile);
    const dr = Math.abs(toRank - fromRank);
    const dir = piece[0] === 'w' ? -1 : 1;
    
    switch(type) {
      case 'P':
        if (toFile === fromFile) {
          if (toRank === fromRank + dir && !targetPiece) return true;
          if ((fromRank === 6 && piece[0] === 'w') || (fromRank === 1 && piece[0] === 'b')) {
            if (toRank === fromRank + 2*dir && !targetPiece && !this.board[fromRank+dir][fromFile]) return true;
          }
        }
        if (df === 1 && toRank === fromRank + dir && targetPiece) return true;
        break;
      case 'N':
        if ((df === 2 && dr === 1) || (df === 1 && dr === 2)) return true;
        break;
      case 'B':
        if (df === dr && this.isPathClear(fromFile, fromRank, toFile, toRank)) return true;
        break;
      case 'R':
        if ((df === 0 || dr === 0) && this.isPathClear(fromFile, fromRank, toFile, toRank)) return true;
        break;
      case 'Q':
        if ((df === dr || df === 0 || dr === 0) && this.isPathClear(fromFile, fromRank, toFile, toRank)) return true;
        break;
      case 'K':
        if (df <= 1 && dr <= 1) return true;
        break;
    }
    return false;
  }
  
  isPathClear(fromFile, fromRank, toFile, toRank) {
    const df = Math.sign(toFile - fromFile);
    const dr = Math.sign(toRank - fromRank);
    let f = fromFile + df;
    let r = fromRank + dr;
    
    while (f !== toFile || r !== toRank) {
      if (this.board[r][f]) return false;
      f += df;
      r += dr;
    }
    return true;
  }
  
  move(from, to) {
    if (!this.isValidMove(from, to)) return false;
    
    const [fromFile, fromRank] = this.squareToCoords(from);
    const [toFile, toRank] = this.squareToCoords(to);
    
    const piece = this.board[fromRank][fromFile];
    const captured = this.board[toRank][toFile];
    
    this.board[toRank][toFile] = piece;
    this.board[fromRank][fromFile] = null;
    
    // Promotion
    if (piece[1] === 'P' && (toRank === 0 || toRank === 7)) {
      this.board[toRank][toFile] = piece[0] + 'Q';
    }
    
    this.history.push({from, to, piece, captured});
    this.turn = this.turn === 'w' ? 'b' : 'w';
    if (this.turn === 'w') this.moveCount++;
    
    return true;
  }
  
  undo() {
    if (this.history.length === 0) return false;
    
    const lastMove = this.history.pop();
    const [fromFile, fromRank] = this.squareToCoords(lastMove.from);
    const [toFile, toRank] = this.squareToCoords(lastMove.to);
    
    this.board[fromRank][fromFile] = lastMove.piece;
    this.board[toRank][toFile] = lastMove.captured;
    
    this.turn = this.turn === 'w' ? 'b' : 'w';
    if (this.turn === 'b') this.moveCount--;
    
    return true;
  }
  
  getAllMoves() {
    const moves = [];
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = this.board[rank][file];
        if (piece && piece[0] === this.turn) {
          const from = this.coordsToSquare(file, rank);
          for (let tr = 0; tr < 8; tr++) {
            for (let tf = 0; tf < 8; tf++) {
              const to = this.coordsToSquare(tf, tr);
              if (this.isValidMove(from, to)) {
                moves.push({from, to});
              }
            }
          }
        }
      }
    }
    return moves;
  }
  
  isKingInCheck(color) {
    let kingPos = null;
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        if (this.board[r][f] === color + 'K') {
          kingPos = this.coordsToSquare(f, r);
          break;
        }
      }
      if (kingPos) break;
    }
    
    const enemyColor = color === 'w' ? 'b' : 'w';
    const originalTurn = this.turn;
    this.turn = enemyColor;
    const enemyMoves = this.getAllMoves();
    this.turn = originalTurn;
    
    return enemyMoves.some(m => m.to === kingPos);
  }
  
  isGameOver() {
    return this.getAllMoves().length === 0;
  }
}

// Variables globales
let game = new SimpleChess();
let selectedSquare = null;
let flipped = false;

const pieces = {
  'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
  'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
};

function drawBoard() {
  const container = document.getElementById('chessboard');
  if (!container) {
    console.error('Element #chessboard not found!');
    return;
  }
  
  container.innerHTML = '';
  
  const board = game.getBoard();
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const displayRank = flipped ? 7 - rank : rank;
      const displayFile = flipped ? 7 - file : file;
      
      const square = document.createElement('div');
      const squareName = String.fromCharCode(97 + displayFile) + (8 - displayRank);
      
      const isLight = (rank + file) % 2 === 1;
      square.className = 'square ' + (isLight ? 'light' : 'dark');
      square.dataset.square = squareName;
      
      const piece = board[displayRank][displayFile];
      if (piece) {
        square.textContent = pieces[piece] || '';
      }
      
      if (selectedSquare === squareName) {
        square.classList.add('selected');
      }
      
      square.addEventListener('click', () => onSquareClick(squareName));
      container.appendChild(square);
    }
  }
}

function onSquareClick(square) {
  const piece = game.getPiece(square);
  
  if (selectedSquare) {
    if (selectedSquare === square) {
      selectedSquare = null;
      drawBoard();
      return;
    }
    
    if (game.move(selectedSquare, square)) {
      selectedSquare = null;
      drawBoard();
      updateHistory();
      
      if (!game.isGameOver()) {
        setTimeout(() => botMove(), 400);
      } else {
        checkGameOver();
      }
    } else {
      if (piece && piece[0] === game.turn) {
        selectedSquare = square;
        drawBoard();
      } else {
        selectedSquare = null;
        drawBoard();
      }
    }
  } else {
    if (piece && piece[0] === game.turn) {
      selectedSquare = square;
      drawBoard();
    }
  }
}

function updateHistory() {
  const historyEl = document.getElementById('history');
  if (!historyEl) return;
  
  let text = '';
  game.history.forEach((move, i) => {
    if (i % 2 === 0) text += `${Math.floor(i / 2) + 1}. `;
    text += `${move.from}-${move.to} `;
    if (i % 2 === 1) text += '\n';
  });
  historyEl.textContent = text || 'Aucun coup joué.';
}

function chat(message) {
  const chatEl = document.getElementById('bot-chat');
  if (chatEl) chatEl.textContent = message;
}

function evaluateBoard() {
  const values = {P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000};
  let score = 0;
  
  const board = game.getBoard();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (piece) {
        const value = values[piece[1]] || 0;
        score += piece[0] === 'w' ? value : -value;
      }
    }
  }
  return score;
}

function botMove() {
  const level = parseInt(document.getElementById('level').value);
  const moves = game.getAllMoves();
  
  if (moves.length === 0) return;
  
  const candidates = moves.map(move => {
    game.move(move.from, move.to);
    const score = -evaluateBoard();
    game.undo();
    return {move, score};
  });
  
  candidates.sort((a, b) => b.score - a.score);
  
  const topCount = Math.max(1, Math.ceil(level * 1.5));
  const chosenIndex = Math.floor(Math.random() * Math.min(topCount, candidates.length));
  const chosen = candidates[chosenIndex].move;
  
  game.move(chosen.from, chosen.to);
  drawBoard();
  updateHistory();
  
  const taunts = [
    "Voilà, simple et efficace. Contrairement à toi.",
    "J'espère que t'as un plan. Moi j'en ai douze.",
    "T'inquiète, tu t'amélioreras… dans une autre vie.",
    "Oh intéressant… non je déconne, c'est nul.",
    "Je pourrais jouer les yeux fermés. Enfin, j'ai pas d'yeux.",
    "Allez, fais voir ce que t'as dans le ventre. Spoiler : pas grand-chose.",
    "C'est tout ? Bon, à mon tour alors.",
    "Tu joues aux échecs ou au morpion là ?",
    "Magnifique coup ! ...de la part d'un débutant.",
    "Continue comme ça, tu vas finir par comprendre les règles."
  ];
  
  chat(taunts[Math.floor(Math.random() * taunts.length)]);
  checkGameOver();
}

function checkGameOver() {
  if (game.isGameOver()) {
    const winner = game.turn === 'w' ? 'Les noirs' : 'Les blancs';
    chat(`💀 Partie terminée ! ${winner} gagnent !`);
  } else if (game.isKingInCheck(game.turn)) {
    chat('⚠️ Échec ! Protège ton roi !');
  }
}

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('newBtn').addEventListener('click', () => {
    game.reset();
    selectedSquare = null;
    drawBoard();
    updateHistory();
    chat('🎮 Nouvelle partie ! Montre-moi ce que tu sais faire.');
  });

  document.getElementById('undoBtn').addEventListener('click', () => {
    if (game.history.length >= 2) {
      game.undo();
      game.undo();
      selectedSquare = null;
      drawBoard();
      updateHistory();
      chat('↩️ Bon ok, on efface ça. Mais je me souviens de ta bêtise.');
    } else {
      chat('🤷 Y\'a rien à annuler, champion !');
    }
  });

  document.getElementById('flipBtn').addEventListener('click', () => {
    flipped = !flipped;
    drawBoard();
    chat('🔃 Ah, tu veux voir les choses différemment ?');
  });

  // Initialisation
  drawBoard();
  updateHistory();
});
