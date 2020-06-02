//== imports ==========================================================================================================

import React from 'react';
import { render, fireEvent, queryByAttribute } from '@testing-library/react';
import Game from './Game';

//== constants ========================================================================================================

const getById = queryByAttribute.bind(null, 'id');

const leftClick = { button: 1 };

//== tests ============================================================================================================

test('Renders game and validates initial state', () => {
  const { getByText } = render(<Game />);

  const nextPlayerElement = getByText(`Next player: O`);
  expect(nextPlayerElement).toBeInTheDocument();
  
  const firstMoveHistoryItemElement = getByText(`Go to game start`);
  expect(firstMoveHistoryItemElement).toBeInTheDocument();
});

test('Plays two moves', () => {
  const dom = render(<Game />);

  // First move
  const x1y1Square = getById(dom.container, 'square_x_1_y_1');
  expect(x1y1Square).toBeInTheDocument();
  expect(x1y1Square).toHaveTextContent('');

  fireEvent.click(x1y1Square, leftClick);
  expect(x1y1Square).toHaveTextContent('O');

  // Second move
  const x2y2Square = getById(dom.container, 'square_x_2_y_2');
  expect(x2y2Square).toBeInTheDocument();
  expect(x2y2Square).toHaveTextContent('');

  fireEvent.click(x2y2Square, leftClick);
  expect(x2y2Square).toHaveTextContent('X');
});

test('Plays whole game', () => {
  const dom = render(<Game />);
  const getByText = dom.getByText

  // O takes 0,0
  const x0y0Square = getById(dom.container, 'square_x_0_y_0');
  fireEvent.click(x0y0Square, leftClick);

  // X takes 1,1
  const x1y1Square = getById(dom.container, 'square_x_1_y_1');
  fireEvent.click(x1y1Square, leftClick);

  // O takes 1,0
  const x1y0Square = getById(dom.container, 'square_x_1_y_0');
  fireEvent.click(x1y0Square, leftClick);

  // X takes 2,1
  const x2y1Square = getById(dom.container, 'square_x_2_y_1');
  fireEvent.click(x2y1Square, leftClick);
  
  // O takes 2,0, and wins.
  const x2y0Square = getById(dom.container, 'square_x_2_y_0');
  fireEvent.click(x2y0Square, leftClick);

  // The win should have happened, assert the victory text is present now.
  const victoryTextElement = getByText(`Winning player: Player 2 (O)`);
  expect(victoryTextElement).toBeInTheDocument();
});