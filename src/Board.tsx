//== imports ==========================================================================================================

import React from 'react';
import Square from './Square.tsx';

//== class init =======================================================================================================

export default class Board extends React.Component {

  componentDidCatch(error, info) {
    console.log(`In componentDidCatch ERROR: ${error}, INFO: ${info}`);
    this.setState({ hasError: true });
  };

  //== render =========================================================================================================

  render() {
    let rowsInTable = [];

    for (let i = 0; i < this.props.boardSize; i++) {
      rowsInTable.push(this.renderRow(i));
    }

    return <div>{rowsInTable}</div>;
  };

  /**
   * Renders a whole row, using {@link renderSquare}.
   * 
   * @param {*} rowNumber The row number to render (0 is the top row).
   */
  renderRow(rowNumber) {
    const squaresInRow = [];

    for (let i = 0; i < this.props.boardSize; i++) {
      squaresInRow.push(this.renderSquare(i, rowNumber, this.getMarkerOnSquare(i, rowNumber)));
    }

    return <div key={`row${rowNumber}`} className="board-row">{squaresInRow}</div>;
  };

  /**
   * Renders a single square.
   * 
   * @param {*} x The x-coordinate of the square in the game matrix.
   * @param {*} y The y-coordinate of the square in the game matrix.
   * @param {*} playerMarker The marker of the player that 'owns' the square (can be null if none does).
   */
  renderSquare(x, y, playerMarker) {
    const itemKey = `square_x_${x}_y_${y}`;

    return <Square
      key={itemKey}
      id={itemKey}
      clickHandler={() => this.squareClickHandler(x, y)}
      playerMarker={playerMarker}>
    </Square>;
  };

  //== helpers ========================================================================================================

  squareClickHandler(x, y) {
    console.log(`Clicked x=${x}, y=${y}`);

    if (!this.props.gameInProgress) {
      // Do nothing if the game is already over!
      console.log(`Can't play move at x=${x}, y=${y} as the game is over!`);

    } else if (this.getMarkerOnSquare(x, y) != null) {
      // Do nothing if the square is already occupied; an invalid move was selected.
      console.log(`Square x=${x}, y=${y} is already occupied with another player's marker!`);

    } else {
      // Play out the turn if the square isn't occupied.
      this.props.markerPlacedCallback(x, y);
    }
  }

  getMarkerOnSquare(x, y) {
    for (let i = 0; i < this.props.movesToDisplay.length; i++) {
      let move = this.props.movesToDisplay[i];
      if (move.x === x && move.y === y) {
        return move.playerMarker;
      }
    }

    // The square hasn't had a marker placed on it.
    return null;
  }
}