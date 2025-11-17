// bot.js — logique du jeu + UI
let game = new Chess();
let selectedSquare = null;
let flipped = false;

// Pièces Unicode
const pieces = {
  'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
  'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
};

// Convertir notation (e2) en index 0-63
function squareToIndex(square) {
  const file = square.charCodeAt(0) - 97; // a=0, b=1...
  const rank = parseInt(square[1]) - 1;
  return rank * 8 + file;
}

// Convertir index en notation (e2)
function indexToSquare(index) {
  const file = String.fromCharCode(97 + (index % 8));
  const rank = Math.floor(index / 8) + 1;
  return file + rank;
}

// Dessiner l'échiquier
function drawBoard() {
  const container = document.getElementById('chessboard-squares');
  container.innerHTML = '';
  
  const board = game.board();
  
  for (let rank = 7; rank >= 0; rank--) {
    for (let file = 0; file < 8; file++) {
      const displayRank = flipped ? 7 - rank : rank;
      const displayFile = flipped ? 7 - file : file;
      
      const square = document.createElement('div');
      const squareName = indexToSquare(displayRank * 8 + displayFile);
      const isLight = (displayRank + displayFile) % 2 === 0;
      
      square.className = 'square ' + (isLight ? 'light' : 'dark');
      square.dataset.square = squareName;
      
      const piece = board[displayRank][displayFile];
      if (piece) {
        const pieceCode = piece.color + piece.type.toUpperCase();
        square.textContent = pieces[pieceCode] || '';
      }
      
      square.addEventListener('click', () => onSquareClick(squareName));
      container.appendChild(square);
    }
  }
}

// Gestion des clics
function onSquareClick(square) {
  const piece = game.get(square);
  
  if (selectedSquare) {
    // Tentative de déplacement
    const move = game.move({
      from: selectedSquare,
      to: square,
      promotion: 'q' // Toujours promouvoir en dame
    });
    
    if (move) {
      drawBoard();
      updateHistory();
      selectedSquare = null;
      
      // Tour du bot après un court délai
      if (!game.game_over()) {
        setTimeout(() => botMove(), 500);
      } else {
        checkGameOver();
      }
    } else {
      // Sélectionner une autre pièce
      if (piece && piece.color === game.turn()) {
        selectedSquare = square;
        highlightSquare(square);
      } else {
        selectedSquare = null;
        drawBoard();
      }
    }
  } else {
    // Sélectionner une pièce
    if (piece && piece.color === game.turn()) {
      selectedSquare = square;
      highlightSquare(square);
    }
  }
}

// Surligner une case
function highlightSquare(square) {
  drawBoard();
  const element = document.querySelector(`[data-square="${square}"]`);
  if (element) {
    element.classList.add('highlight');
  }
}

// Mise à jour de l'historique
function updateHistory() {
  const history = game.history({ verbose: true });
  let text = '';
  
  for (let i = 0; i < history.length; i++) {
    if (i % 2 === 0) {
      text += `${Math.floor(i / 2) + 1}. `;
    }
    text += history[i].san + ' ';
    if (i % 2 === 1) text += '\n';
  }
  
  document.getElementById('history').textContent = text || 'Aucun coup joué.';
}

// Message du bot
function chat(message) {
  document.getElementById('bot-chat').textContent = message;
}

// Évaluation simple de la position
function evaluateBoard() {
  const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  let score = 0;
  
  const board = game.board();
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (piece) {
        const value = values[piece.type] || 0;
        score += piece.color === 'w' ? value : -value;
      }
    }
  }
  
  return score;
}

// Mouvement du bot
function botMove() {
  const level = parseInt(document.getElementById('level').value);
  const moves = game.moves();
  
  if (moves.length === 0) return;
  
  // Évaluer tous les coups possibles
  const candidates = moves.map(move => {
    game.move(move);
    const score = evaluateBoard();
    game.undo();
    return { move, score };
  });
  
  // Trier selon la couleur du bot
  candidates.sort((a, b) => {
    return game.turn() === 'w' ? b.score - a.score : a.score - b.score;
  });
  
  // Choisir parmi les meilleurs coups selon le niveau
  const topCount = Math.max(1, Math.floor(candidates.length * Math.min(0.25 + level / 40, 0.9)));
  const chosenIndex = Math.floor(Math.random() * topCount);
  const chosen = candidates[chosenIndex].move;
  
  game.move(chosen);
  drawBoard();
  updateHistory();
  
  // Messages insolents
  const taunts = [
    "Voilà, simple et efficace. Contrairement à toi.",
    "J'espère que t'as un plan. Moi j'en ai 12.",
    "T'inquiète, tu t'amélioreras… un jour.",
    "Oh intéressant… non je rigole.",
    "Je pourrais jouer les yeux fermés là.",
    "Allez, fais voir ce que t'as dans le ventre. Spoiler : pas grand-chose."
  ];
  
  chat(taunts[Math.floor(Math.random() * taunts.length)]);
  checkGameOver();
}

// Vérifier fin de partie
function checkGameOver() {
  if (game.in_checkmate()) {
    chat('Échec et mat ! Partie terminée. ' + (game.turn() === 'w' ? 'Les noirs gagnent !' : 'Les blancs gagnent !'));
  } else if (game.in_draw()) {
    chat('Match nul ! Bon, on va dire que tu t\'en sors pas trop mal.');
  } else if (game.in_stalemate()) {
    chat('Pat ! C\'est un nul. T\'as eu de la chance.');
  } else if (game.in_check()) {
    chat('Échec ! Fais gaffe à ton roi.');
  }
}

// Boutons
document.getElementById('newBtn').addEventListener('click', () => {
  game.reset();
  selectedSquare = null;
  drawBoard();
  updateHistory();
  chat('Nouvelle partie ! Montre-moi ce que tu sais faire.');
});

document.getElementById('undoBtn').addEventListener('click', () => {
  game.undo(); // Annuler coup du bot
  game.undo(); // Annuler coup du joueur
  selectedSquare = null;
  drawBoard();
  updateHistory();
  chat('Bon ok, on efface ça. Mais je me souviens de ta bêtise.');
});

document.getElementById('flipBtn').addEventListener('click', () => {
  flipped = !flipped;
  drawBoard();
});

// Initialisation
drawBoard();
updateHistory();
