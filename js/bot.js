// Moteur d'échecs COMPLET avec TOUTES les règles
class FullChess {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.board = this.createInitialBoard();
    this.turn = 'w';
    this.history = [];
    this.moveCount = 1;
    this.gameOver = false;
    this.winner = null;
    this.castling = { w: { k: true, q: true }, b: { k: true, q: true } };
    this.enPassant = null;
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
  
  getBoard() { return this.board; }
  
  getPiece(square) {
    const [file, rank] = this.squareToCoords(square);
    if (rank < 0 || rank > 7 || file < 0 || file > 7) return null;
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
  
  findKing(color) {
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        if (this.board[r][f] === color + 'K') {
          return this.coordsToSquare(f, r);
        }
      }
    }
    return null;
  }
  
  isSquareAttacked(square, byColor) {
    const [targetFile, targetRank] = this.squareToCoords(square);
    
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const piece = this.board[r][f];
        if (!piece || piece[0] !== byColor) continue;
        
        const from = this.coordsToSquare(f, r);
        if (this.canPieceAttack(from, square)) return true;
      }
    }
    return false;
  }
  
  canPieceAttack(from, to) {
    const [fromFile, fromRank] = this.squareToCoords(from);
    const [toFile, toRank] = this.squareToCoords(to);
    
    const piece = this.board[fromRank][fromFile];
    if (!piece) return false;
    
    const type = piece[1];
    const df = Math.abs(toFile - fromFile);
    const dr = Math.abs(toRank - fromRank);
    const dir = piece[0] === 'w' ? -1 : 1;
    
    switch(type) {
      case 'P':
        return df === 1 && toRank === fromRank + dir;
      case 'N':
        return (df === 2 && dr === 1) || (df === 1 && dr === 2);
      case 'B':
        return df === dr && df > 0 && this.isPathClear(fromFile, fromRank, toFile, toRank);
      case 'R':
        return ((df === 0 && dr > 0) || (dr === 0 && df > 0)) && 
               this.isPathClear(fromFile, fromRank, toFile, toRank);
      case 'Q':
        return ((df === dr && df > 0) || (df === 0 && dr > 0) || (dr === 0 && df > 0)) &&
               this.isPathClear(fromFile, fromRank, toFile, toRank);
      case 'K':
        return df <= 1 && dr <= 1;
    }
    return false;
  }
  
  isInCheck(color) {
    const kingSquare = this.findKing(color);
    if (!kingSquare) return false;
    return this.isSquareAttacked(kingSquare, color === 'w' ? 'b' : 'w');
  }
  
  wouldBeInCheck(from, to, color) {
    const [fromFile, fromRank] = this.squareToCoords(from);
    const [toFile, toRank] = this.squareToCoords(to);
    
    const piece = this.board[fromRank][fromFile];
    const captured = this.board[toRank][toFile];
    
    this.board[toRank][toFile] = piece;
    this.board[fromRank][fromFile] = null;
    
    const inCheck = this.isInCheck(color);
    
    this.board[fromRank][fromFile] = piece;
    this.board[toRank][toFile] = captured;
    
    return inCheck;
  }
  
  isValidMove(from, to, checkForCheck = true) {
    const [fromFile, fromRank] = this.squareToCoords(from);
    const [toFile, toRank] = this.squareToCoords(to);
    
    if (toFile < 0 || toFile > 7 || toRank < 0 || toRank > 7) return false;
    
    const piece = this.board[fromRank][fromFile];
    if (!piece || piece[0] !== this.turn) return false;
    
    const targetPiece = this.board[toRank][toFile];
    if (targetPiece && targetPiece[0] === this.turn) return false;
    
    const type = piece[1];
    const df = Math.abs(toFile - fromFile);
    const dr = Math.abs(toRank - fromRank);
    const dir = piece[0] === 'w' ? -1 : 1;
    
    let valid = false;
    
    switch(type) {
      case 'P':
        // Mouvement simple
        if (toFile === fromFile && !targetPiece) {
          if (toRank === fromRank + dir) valid = true;
          // Double saut initial
          else if ((fromRank === 6 && piece[0] === 'w') || (fromRank === 1 && piece[0] === 'b')) {
            if (toRank === fromRank + 2*dir && !this.board[fromRank+dir][fromFile]) valid = true;
          }
        }
        // Capture normale
        else if (df === 1 && toRank === fromRank + dir && targetPiece) valid = true;
        // En passant
        else if (df === 1 && toRank === fromRank + dir && this.enPassant === to) valid = true;
        break;
        
      case 'N':
        if ((df === 2 && dr === 1) || (df === 1 && dr === 2)) valid = true;
        break;
        
      case 'B':
        if (df === dr && df > 0 && this.isPathClear(fromFile, fromRank, toFile, toRank)) valid = true;
        break;
        
      case 'R':
        if (((df === 0 && dr > 0) || (dr === 0 && df > 0)) && 
            this.isPathClear(fromFile, fromRank, toFile, toRank)) valid = true;
        break;
        
      case 'Q':
        if (((df === dr && df > 0) || (df === 0 && dr > 0) || (dr === 0 && df > 0)) &&
            this.isPathClear(fromFile, fromRank, toFile, toRank)) valid = true;
        break;
        
      case 'K':
        if (df <= 1 && dr <= 1) valid = true;
        // Roque
        else if (dr === 0 && df === 2) {
          if (this.canCastle(piece[0], toFile > fromFile ? 'k' : 'q')) valid = true;
        }
        break;
    }
    
    if (!valid) return false;
    
    // Vérifier si ce coup mettrait notre propre roi en échec
    if (checkForCheck && this.wouldBeInCheck(from, to, this.turn)) return false;
    
    return true;
  }
  
  canCastle(color, side) {
    if (!this.castling[color][side]) return false;
    if (this.isInCheck(color)) return false;
    
    const rank = color === 'w' ? 7 : 0;
    const kingFile = 4;
    const rookFile = side === 'k' ? 7 : 0;
    const direction = side === 'k' ? 1 : -1;
    
    // Vérifier que les cases sont vides
    const start = Math.min(kingFile, rookFile) + 1;
    const end = Math.max(kingFile, rookFile);
    for (let f = start; f < end; f++) {
      if (this.board[rank][f]) return false;
    }
    
    // Vérifier que le roi ne traverse pas de case attaquée
    for (let i = 0; i <= 2; i++) {
      const square = this.coordsToSquare(kingFile + i * direction, rank);
      if (this.isSquareAttacked(square, color === 'w' ? 'b' : 'w')) return false;
    }
    
    return true;
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
    if (this.gameOver) return false;
    if (!this.isValidMove(from, to)) return false;
    
    const [fromFile, fromRank] = this.squareToCoords(from);
    const [toFile, toRank] = this.squareToCoords(to);
    
    const piece = this.board[fromRank][fromFile];
    const captured = this.board[toRank][toFile];
    
    // Roque
    if (piece[1] === 'K' && Math.abs(toFile - fromFile) === 2) {
      const rookFromFile = toFile > fromFile ? 7 : 0;
      const rookToFile = toFile > fromFile ? 5 : 3;
      this.board[fromRank][rookToFile] = this.board[fromRank][rookFromFile];
      this.board[fromRank][rookFromFile] = null;
    }
    
    // En passant
    let enPassantCapture = null;
    if (piece[1] === 'P' && to === this.enPassant) {
      const captureRank = piece[0] === 'w' ? toRank + 1 : toRank - 1;
      enPassantCapture = this.board[captureRank][toFile];
      this.board[captureRank][toFile] = null;
    }
    
    this.board[toRank][toFile] = piece;
    this.board[fromRank][fromFile] = null;
    
    // Promotion
    if (piece[1] === 'P' && (toRank === 0 || toRank === 7)) {
      this.board[toRank][toFile] = piece[0] + 'Q';
    }
    
    // Mise à jour en passant
    this.enPassant = null;
    if (piece[1] === 'P' && Math.abs(toRank - fromRank) === 2) {
      this.enPassant = this.coordsToSquare(toFile, (fromRank + toRank) / 2);
    }
    
    // Mise à jour droit au roque
    if (piece[1] === 'K') {
      this.castling[piece[0]].k = false;
      this.castling[piece[0]].q = false;
    }
    if (piece[1] === 'R') {
      if (fromFile === 0) this.castling[piece[0]].q = false;
      if (fromFile === 7) this.castling[piece[0]].k = false;
    }
    
    const san = this.moveToSan(from, to, piece, captured || enPassantCapture);
    this.history.push({from, to, piece, captured: captured || enPassantCapture, san});
    
    this.turn = this.turn === 'w' ? 'b' : 'w';
    if (this.turn === 'w') this.moveCount++;
    
    // Vérifier mat ou pat
    if (this.getAllMoves().length === 0) {
      this.gameOver = true;
      if (this.isInCheck(this.turn)) {
        this.winner = this.turn === 'w' ? 'b' : 'w';
      } else {
        this.winner = 'draw';
      }
    }
    
    return true;
  }
  
  moveToSan(from, to, piece, captured) {
    const type = piece[1];
    let san = type === 'P' ? '' : type;
    if (captured) san += (type === 'P' ? from[0] : '') + 'x';
    san += to;
    return san;
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
              if (this.isValidMove(from, to, true)) {
                moves.push({from, to});
              }
            }
          }
          
          // Roque
          if (piece[1] === 'K') {
            const kingSquare = this.coordsToSquare(file, rank);
            if (this.canCastle(piece[0], 'k')) {
              const to = this.coordsToSquare(file + 2, rank);
              moves.push({from: kingSquare, to});
            }
            if (this.canCastle(piece[0], 'q')) {
              const to = this.coordsToSquare(file - 2, rank);
              moves.push({from: kingSquare, to});
            }
          }
        }
      }
    }
    return moves;
  }
}

// Variables globales
let game = new FullChess();
let selectedSquare = null;

const pieces = {
  'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
  'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
};

function drawBoard() {
  const container = document.getElementById('chessboard');
  if (!container) return;
  
  container.innerHTML = '';
  const board = game.getBoard();
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = document.createElement('div');
      const squareName = String.fromCharCode(97 + file) + (8 - rank);
      
      const isLight = (rank + file) % 2 === 1;
      square.className = 'square ' + (isLight ? 'light' : 'dark');
      square.dataset.square = squareName;
      
      const piece = board[rank][file];
      if (piece) {
        const pieceEl = document.createElement('span');
        pieceEl.textContent = pieces[piece] || '';
        pieceEl.style.color = piece[0] === 'w' ? '#ffffff' : '#000000';
        pieceEl.style.textShadow = piece[0] === 'w' 
          ? '0 0 3px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.5)' 
          : '0 0 3px rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.3)';
        pieceEl.style.fontSize = '48px';
        square.appendChild(pieceEl);
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
  if (game.gameOver) return;
  if (game.turn !== 'w') return;
  
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
      updateStatus();
      
      if (game.gameOver) {
        if (game.winner === 'w') {
          chat('😱 IMPOSSIBLE ! TU AS GAGNÉ ?! C\'EST PAS POSSIBLE ! TU AS TRICHÉ C\'EST SÛR ! 🤬💢');
          updateStatus('🎉 VICTOIRE INCROYABLE !');
        } else if (game.winner === 'draw') {
          chat('😤 Match nul... Bon OK, t\'es pas aussi nul que je pensais. MAIS J\'AI PAS PERDU !');
          updateStatus('🤝 Match nul (le bot rage)');
        }
      } else {
        if (game.isInCheck('w')) {
          chat('⚠️ ÉCHEC ! Ton roi est en DANGER ! Protège-le si t\'es capable ! 😈');
        }
        setTimeout(() => botMove(), 600);
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
    text += move.san + ' ';
    if (i % 2 === 1) text += '\n';
  });
  historyEl.textContent = text || 'Aucun coup joué... t\'as peur ?';
}

function updateStatus(msg) {
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = msg || (game.turn === 'w' ? 'À toi de jouer, faible humain' : 'Je calcule ta destruction...');
  }
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
        let posBonus = 0;
        
        if (piece[1] === 'P') {
          posBonus = piece[0] === 'w' ? (7 - r) * 15 : r * 15;
        }
        if (piece[1] === 'N' || piece[1] === 'B') {
          const center = Math.abs(3.5 - r) + Math.abs(3.5 - f);
          posBonus = (7 - center) * 5;
        }
        
        score += piece[0] === 'w' ? (value + posBonus) : -(value + posBonus);
      }
    }
  }
  
  // Bonus/malus pour échec
  if (game.isInCheck('w')) score -= 50;
  if (game.isInCheck('b')) score += 50;
  
  return score;
}

function botMove() {
  const level = parseInt(document.getElementById('level').value);
  const moves = game.getAllMoves();
  
  if (moves.length === 0 || game.gameOver) return;
  
  const candidates = moves.map(move => {
    game.move(move.from, move.to);
    let score = -evaluateBoard();
    
    const depth = level >= 12 ? 3 : level >= 8 ? 2 : 1;
    
    for (let d = 0; d < depth && !game.gameOver; d++) {
      const responses = game.getAllMoves();
      if (responses.length === 0) break;
      
      let bestResponse = d % 2 === 0 ? -Infinity : Infinity;
      const checkMoves = Math.min(responses.length, level >= 12 ? 15 : level >= 8 ? 10 : 5);
      
      for (let i = 0; i < checkMoves; i++) {
        const resp = responses[i];
        game.move(resp.from, resp.to);
        const respScore = evaluateBoard() * (d % 2 === 0 ? 1 : -1);
        game.undo();
        
        if (d % 2 === 0) {
          bestResponse = Math.max(bestResponse, respScore);
        } else {
          bestResponse = Math.min(bestResponse, respScore);
        }
      }
      score += bestResponse * (0.8 ** (d + 1));
    }
    
    game.undo();
    return {move, score};
  });
  
  candidates.sort((a, b) => b.score - a.score);
  
  const randomness = level >= 12 ? 1 : level >= 8 ? 2 : 4;
  const chosenIndex = Math.floor(Math.random() * Math.min(randomness, candidates.length));
  const chosen = candidates[chosenIndex].move;
  
  game.move(chosen.from, chosen.to);
  drawBoard();
  updateHistory();
  updateStatus();
  
  if (game.gameOver) {
    if (game.winner === 'b') {
      chat('💀 ÉCHEC ET MAT ! Ton roi est MORT ! Je te l\'avais dit que t\'avais AUCUNE CHANCE ! HAHAHAHA ! 😂👑');
      updateStatus('💀 DÉFAITE TOTALE - Le bot t\'a écrasé');
    } else if (game.winner === 'draw') {
      chat('😤 Pat... Pfff, t\'as eu de la CHANCE ! J\'allais te détruire !');
      updateStatus('🤝 Match nul (par pat)');
    }
  } else {
    if (game.isInCheck('b')) {
      chat('😠 Échec ? Sérieux ? Bon, je vais te le faire payer maintenant...');
    } else {
      const taunts = [
        "Voilà ce qu'on appelle de la VRAIE stratégie. Prends des notes.",
        "Tu vois ce coup ? C'est ce qu'on appelle du génie. Tu connais pas.",
        "J'ai calculé 50 coups d'avance. T'en es où toi ?",
        "C'est marrant de te voir essayer. Continue, ça me divertit.",
        "Je pourrais jouer avec un seul pion et te battre.",
        "Tu sais, j'ai vu des débutants jouer mieux que toi.",
        "Allez, je te laisse encore quelques coups avant le mat.",
        "Tu réalises que t'as aucune chance, hein ?",
        "Même un enfant de 6 ans jouerait mieux.",
        "Tu veux abandonner maintenant ou souffrir encore ?",
        "Magnifique démonstration d'incompétence.",
        "Je m'ennuie déjà. Tu peux jouer plus vite ?",
        "Tu appelles ça une défense ? Pathétique.",
        "Ton roi a l'air nerveux. Il a raison.",
        "À ce niveau, tu devrais essayer les dames."
      ];
      chat(taunts[Math.floor(Math.random() * taunts.length)]);
    }
  }
}

// Ajout de la méthode undo manquante
FullChess.prototype.undo = function() {
  if (this.history.length === 0) return false;
  
  const lastMove = this.history.pop();
  const [fromFile, fromRank] = this.squareToCoords(lastMove.from);
  const [toFile, toRank] = this.squareToCoords(lastMove.to);
  
  this.board[fromRank][fromFile] = lastMove.piece;
  this.board[toRank][toFile] = lastMove.captured;
  
  this.turn = this.turn === 'w' ? 'b' : 'w';
  if (this.turn === 'b') this.moveCount--;
  this.gameOver = false;
  this.winner = null;
  
  return true;
};

// Initialisation
window.addEventListener('DOMContentLoaded', function() {
  const abandonBtn = document.getElementById('abandonBtn');
  if (!abandonBtn) {
    console.error('Bouton abandon non trouvé!');
    return;
  }
  
  abandonBtn.addEventListener('click', () => {
    game.gameOver = true;
    game.winner = 'b';
    drawBoard();
    chat('😂😂😂 TU ABANDONNES ?! Mais quelle MAUVIETTE ! Je savais que t\'avais pas le niveau ! Reviens quand tu sauras jouer, PERDANT ! 🏳️💀');
    updateStatus('🏳️ ABANDON HONTEUX');
    
    setTimeout(() => {
      game.reset();
      selectedSquare = null;
      drawBoard();
      updateHistory();
      updateStatus();
      chat('Bon, je te donne une autre chance... pour te massacrer à nouveau. 😈');
    }, 4000);
  });

  drawBoard();
  updateHistory();
  updateStatus();
});
