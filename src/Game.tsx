//== imports ==========================================================================================================

import React, { Component } from 'react';
import Board from './Board.tsx';

//== constants ========================================================================================================

const BOARD_SIZE = 3;

const PLAYER_INFO = {
  PLAYER_ONE: {
    name: 'Player 1 (X)',
    marker: 'X'
  },
  PLAYER_TWO: {
    name: 'Player 2 (O)',
    marker: 'O'
  }
};

const INITIAL_PLAYER = PLAYER_INFO.PLAYER_TWO;

//== class init =======================================================================================================

export default class Game extends Component {
  constructor(props) {
    super(props);

    this.boardSize = BOARD_SIZE;

    this.state = {
      hasError: false,
      errorMessage: '',

      playerWhosTurnItIs: INITIAL_PLAYER,
      playerWhoHasWon: null,

      moves: [],
      selectedMove: 0
    };
  };

  makeError(message) {
    this.setState({
      hasError: true,
      errorMessage: message
    });
  };

  //== render =========================================================================================================

  render() {
    if (this.state.hasError) {
      return <div>Error: {!this.state.errorMessage ? "<No message>" : this.state.errorMessage}</div>

    } else {
      return <div className="game">
        <div className="game-board">
          <Board
            movesToDisplay={this.getMovesToDisplay()}
            boardSize={this.boardSize}
            markerPlacedCallback={(x, y) => this.onTurn(x, y, this.state.playerWhosTurnItIs.marker)}
            gameInProgress={this.state.playerWhoHasWon === null}
          />
        </div>

        <div className="game-info">
          <div className="status">{this.renderStatusMessage()}</div>
          <div className="move-history-list">
            {this.renderMoveHistoryList()}
          </div>
        </div>
      </div>
    }
  };

  renderStatusMessage() {
    if (this.state.playerWhoHasWon === null) {
      return `Next player: ${this.state.playerWhosTurnItIs.marker}`;
    } else {
      return `Winning player: ${this.state.playerWhoHasWon.name}`;
    }
  }

  renderMoveHistoryList() {
    const moveHistoryList = [];

    // Add the inital state as a 'move' of sorts. This will allow the user to return to the start of the game.
    moveHistoryList.push(this.renderMoveHistoryItem(null, 0));

    for (let i = 0; i < this.state.moves.length; i++) {
      let move = this.state.moves[i];
      if (!!move) {
        // Move indices are 1-indexed.
        moveHistoryList.push(this.renderMoveHistoryItem(move, i + 1));
      }
    }

    return moveHistoryList;
  };

  renderMoveHistoryItem(move, index) {
    const moveDescription = index === 0 ? "game start" : ("move #" + index);

    return (
      <div
        className="move-history-item"
        key={`moveHistoryItem${index}`}
        onClick={() => this.jumpToMove(index)}>
        <span>{index}: </span>
        <button>Go to {moveDescription}</button>
      </div>
    );
  };

  //== helpers: state transitions =====================================================================================

  /**
   * Updates the player turn state (from the player whos turn it is now, to the next player).
   * Stores the move history.
   */
  onTurn(x, y, playerMarker) {
    // In normal gameplay (where the user hasn't click move history buttons), we might be on 
    // move 4 of a game, and the 'selectedMove' counter will be as such. However, the user 
    // can click to view a previous move (say, move 2), and the board will update, but the moves
    // visible will remain the same, until a move is played, and then all of the history down to
    // the last two moves will be erased, and the *new* move 3 will be added to the move list.
    let movesTemp;
    if (this.state.selectedMove === this.state.moves.length) {
      movesTemp = this.state.moves.slice(0);
    } else {
      movesTemp = this.state.moves.slice(0, this.state.selectedMove);
    }

    movesTemp.push(this.createMoveHistoryItem(x, y, playerMarker));

    this.setState({
      playerWhosTurnItIs: this.nextPlayer(this.state.playerWhosTurnItIs),
      moves: movesTemp,
      selectedMove: this.state.selectedMove + 1
    }, this.checkAndApplyWinConditions);
  }

  checkAndApplyWinConditions() {
    let winningMarker = this.getMarkerUsedInCompleteLineIfPresent();

    if (winningMarker != null) {
      this.playerHasWon(winningMarker);
    } else {
      this.clearVictoryFlagIfPresent();
    }
  }

  clearVictoryFlagIfPresent() {
    this.setState({
      playerWhoHasWon: null
    });
  }

  playerHasWon(playerMarker) {
    console.log(`playerHasWon: Player with marker ${playerMarker} won.`);

    if (PLAYER_INFO.PLAYER_ONE.marker === playerMarker) {
      this.setState({
        playerWhoHasWon: PLAYER_INFO.PLAYER_ONE
      });

    } else if (PLAYER_INFO.PLAYER_TWO.marker === playerMarker) {
      this.setState({
        playerWhoHasWon: PLAYER_INFO.PLAYER_TWO
      });

    } else {
      this.setState({
        hasError: true,
        errorMessage: `Player with unknown marker ${playerMarker} won.`
      });
    }
  }

  /**
   * Determines who's turn it is next.
   * 
   * @param {*} currentPlayer The current player.
   */
  nextPlayer(currentPlayer) {
    if (currentPlayer === PLAYER_INFO.PLAYER_ONE) {
      return PLAYER_INFO.PLAYER_TWO;

    } else if (currentPlayer === PLAYER_INFO.PLAYER_TWO) {
      return PLAYER_INFO.PLAYER_ONE;

    } else {
      this.makeError(`Current player: ${currentPlayer}, nextPlayer(...) doesn't know who follows them.`);
    }
  }

  //== helpers: history buttons =======================================================================================

  /**
   * Creates a move history item representing the move number, position and the player who made the move.
   * 
   * @param {Number} x The x-coordinate that the move took place on.
   * @param {Number} y The y-coordinate that the move took place on.
   * @param {String} playerMarker The marker of the player that made the move.
   */
  createMoveHistoryItem(x, y, playerMarker) {
    return {
      x: x,
      y: y,
      playerMarker: playerMarker
    };
  }

  /**
   * Make the game jump to a move. 
   * 
   * This causes a disconnect between the usually-aligned 'moves' and 'movesToDisplay()', as we want to 
   * continue to track all the moves made thus far (even those in the future of where we jumped to), 
   * until another move is made (post-jump), at which point future moves are expected to be erased, and 
   * 'moves' and 'movesToDisplay()' are once again, aligned.
   * 
   * tl;dr: 
   * This does *not* erase the move history! 
   * This doesn't happen until a move has been played *after* jumping back/forward in time (as referenced above).
   * 
   * @param {*} moveHistoryIndex The index of the move history item containing the move history for the target move.
   */
  jumpToMove(moveHistoryIndex) {
    // Address special case (initial state, move 'zero').
    if (moveHistoryIndex === 0) {
      this.setState({
        selectedMove: 0,
        playerWhosTurnItIs: INITIAL_PLAYER
      }, this.clearVictoryFlagIfPresent);

    } else {
      this.setState({
        selectedMove: moveHistoryIndex,
        playerWhosTurnItIs: this.nextPlayer(this.playerFromMarker(this.state.moves[moveHistoryIndex - 1].playerMarker))
      }, this.checkAndApplyWinConditions);
    }
  }

  playerFromMarker(marker) {
    if (marker === PLAYER_INFO.PLAYER_ONE.marker) {
      return PLAYER_INFO.PLAYER_ONE;
    } else if (marker === PLAYER_INFO.PLAYER_TWO.marker) {
      return PLAYER_INFO.PLAYER_TWO;
    }

    this.makeError(`No known player corresponding with marker ${marker}`);
  }

  //== helpers: victory conditions ====================================================================================

  /**
   * If there is complete line of markers from the board (i.e a winning game state for the player holding said markers) 
   * then this returns the marker that this line is composed of. 
   * 
   * If nobody has a complete line (i.e. the game is not yet over), this returns null.
   * 
   * This looks at displayed markers only.
   */
  getMarkerUsedInCompleteLineIfPresent() {
    let winningMarker = this.getCompleteStraightLineIfPresent(true);
    if (winningMarker !== null) {
      return winningMarker;
    }

    winningMarker = this.getCompleteStraightLineIfPresent(false);
    if (winningMarker !== null) {
      return winningMarker;
    }

    winningMarker = this.getCompleteDiagonalLineIfPresent();
    if (winningMarker !== null) {
      return winningMarker;
    }

    return null;
  }

  /**
   * Gets a complete straight line if present.
   * 
   * This looks at displayed markers only.
   * 
   * @param {boolean} columns If we're looking for columns (else, rows)
   */
  getCompleteStraightLineIfPresent(columns) {
    // Check for complete lines (columns )
    for (let line = 0; line < this.boardSize; line++) {

      let lineCouldStillBeWinningMove = true;
      let markerThatCouldWin = null;
      for (let squareInline = 0; squareInline < this.boardSize; squareInline++) {
        if (lineCouldStillBeWinningMove) {
          // The line number corresponds with the x co-ordinate for column checking, and y for row checking.
          let markerInSquare = !!columns ?
            this.getMarkerDisplayedOnSquare(line, squareInline) :
            this.getMarkerDisplayedOnSquare(squareInline, line);

          if (markerInSquare === null) {
            // The line can't be a winning line if there is a blank square in it.
            lineCouldStillBeWinningMove = false;

          } else if (markerThatCouldWin === null) {
            // The marker in the square we are checking is not null, 
            // and we must be on the first iteration (we haven't set 'markerThatCouldWin' yet), so set this value now.
            markerThatCouldWin = markerInSquare;

          } else if (markerInSquare !== markerThatCouldWin) {
            // The line has only had one type of character (so far), but this has been interrupted.
            lineCouldStillBeWinningMove = false;
          }
        }
      }

      if (lineCouldStillBeWinningMove) {
        console.log(`Winning move found from ${markerThatCouldWin}: ${columns ? 'column' : 'row'} ${line}`);
        return markerThatCouldWin;
      }
    }

    // No complete line was found.
    return null;
  }

  /**
   * Gets a complete straight, diagonal line. 
   * 
   * This looks at displayed markers only.
   * 
   * There can only be two of these in a square-shaped board:
   * 1) From 0, 0 to n, n
   * 2) From 0, n to n, 0
   * (where n = square board size)
   */
  getCompleteDiagonalLineIfPresent() {
    // Line starting at [0, 0]
    let firstDiagonalStillPossible = true;
    let firstDiagonalMarker = null;

    // Line starting at [0, n]
    let secondDiagonalStillPossible = true;
    let secondDiagonalMarker = null;

    // Check both lines in the same loop
    const boardSize = this.boardSize;
    for (let i = 0; i < boardSize; i++) {
      // Check the line starting at 0, 0 (x = i, y = i)
      let markerInSquare = this.getMarkerDisplayedOnSquare(i, i);

      if (markerInSquare === null) {
        // The line can't be a winning line if there is a blank square in it.
        firstDiagonalStillPossible = false;

      } else if (firstDiagonalMarker === null) {
        // The marker in the square we are checking is not null, 
        // and we must be on the first iteration (we haven't set 'markerThatCouldWin' yet), so set this value now.
        firstDiagonalMarker = markerInSquare;

      } else if (markerInSquare !== firstDiagonalMarker) {
        // The line has only had one type of character (so far), but this has been interrupted.
        firstDiagonalStillPossible = false;
      }

      // Check the line starting at 0, n (x = i, y = n-1-i) (n-1 due to 0-indexing meaning n-1 is max. index)
      markerInSquare = this.getMarkerDisplayedOnSquare(i, boardSize - 1 - i);

      if (markerInSquare === null) {
        // The line can't be a winning line if there is a blank square in it.
        secondDiagonalStillPossible = false;

      } else if (secondDiagonalMarker === null) {
        // The marker in the square we are checking is not null, 
        // and we must be on the first iteration (we haven't set 'markerThatCouldWin' yet), so set this value now.
        secondDiagonalMarker = markerInSquare;

      } else if (markerInSquare !== secondDiagonalMarker) {
        // The line has only had one type of character (so far), but this has been interrupted.
        secondDiagonalStillPossible = false;
      }
    }

    const messageStart = 'Winning move (diagonal) found from '
    if (firstDiagonalStillPossible) {
      console.log(`${messageStart}${firstDiagonalMarker}: [0, 0] -> [${boardSize}, ${boardSize}]`);
      return firstDiagonalMarker;
    }

    if (secondDiagonalStillPossible) {
      console.log(`${messageStart}${secondDiagonalMarker}: [0, ${boardSize}] -> [${boardSize}, 0]`);
      return secondDiagonalMarker;
    }

    return null;
  }

  //== helpers: squares ===============================================================================================

  getMarkerDisplayedOnSquare(x, y) {
    // We're only interested in what's currently being displayed on the board, 
    // not the markers that might be still tracked in move history.
    let movesToDisplay = this.getMovesToDisplay();

    for (let i = 0; i < movesToDisplay.length; i++) {
      let move = movesToDisplay[i];
      if (move.x === x && move.y === y) {
        return move.playerMarker;
      }
    }

    // The square hasn't had a marker placed on it.
    return null;
  }

  /**
   * Get the array of moves that should currently be displayed on the board.
   */
  getMovesToDisplay() {
    return this.state.moves.slice(0, this.state.selectedMove);
  }
}