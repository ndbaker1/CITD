use std::{ops::Add, usize::MAX};

#[derive(Clone)]
pub struct GameState {
    pub board: GameBoard,
    pub turn_index: usize,
    pub player_turn_order: Vec<String>,
}

impl GameState {
    /// set the value of a given cell in the grid
    pub fn play(&mut self, column_index: usize, player_index: usize) -> Result<bool, String> {
        let grid_column = match self.board.get(column_index) {
            Some(column_vec) => column_vec,
            None => {
                return Err(format!(
                    "player {} cannot play in column {} because it is full.",
                    self.player_turn_order[player_index], column_index
                ))
            }
        };

        match grid_column.iter().position(|id| *id == MAX) {
            // update the owner of the grid cell
            Some(play_index) => {
                // increment index and wrap around
                self.turn_index = (self.turn_index + 1) % self.player_turn_order.len();
                // update the ownership in the board
                self.board[column_index][play_index] = player_index;
                // determine if this is a winning move
                Ok(self.find_connected(4, column_index, play_index, player_index))
            }
            // error
            None => Err(format!(
                "player {} cannot play in column {} because it is full.",
                self.player_turn_order[player_index], column_index
            )),
        }
    }

    fn find_connected(&self, length: usize, column: usize, row: usize, player_code: usize) -> bool {
        fn find_recursive(
            length: usize,
            board: &GameBoard,
            direction: &[i8; 2],
            row: usize,
            column: usize,
            player_code: usize,
        ) -> usize {
            if length > 0
                && ((column as i8 + direction[0]) as usize) < board.len()
                && ((row as i8 + direction[1]) as usize)
                    < board[((column as i8 + direction[0]) as usize)].len()
                && board[((column as i8 + direction[0]) as usize)]
                    [((row as i8 + direction[1]) as usize)]
                    == player_code
            {
                println!("recurseeee: {}", player_code);
                1 + find_recursive(
                    length - 1,
                    board,
                    direction,
                    (row as i8 + direction[1]) as usize,
                    (column as i8 + direction[0]) as usize,
                    player_code,
                )
            } else {
                0
            }
        }

        let cardinals: [[[i8; 2]; 2]; 4] = [
            [[0, 1], [0, -1]],
            [[1, 1], [-1, -1]],
            [[1, 0], [-1, 0]],
            [[1, -1], [-1, 1]],
        ];
        cardinals
            .iter()
            .map(|[dir1, dir2]| {
                find_recursive(length, &self.board, dir1, row, column, player_code)
                    + find_recursive(length, &self.board, dir2, row, column, player_code)
            })
            .max()
            .unwrap_or(0)
            >= length - 1
    }

    pub fn get_turn_player(&self) -> String {
        self.player_turn_order[self.turn_index].clone()
    }

    pub fn get_player_index(&self, player_id: &str) -> Option<usize> {
        self.player_turn_order.iter().position(|id| id == player_id)
    }
}

type GameBoard = Vec<Vec<usize>>;
/// Create the 2D grid board for a Game
pub fn create_game_board(width: usize, height: usize) -> GameBoard {
    vec![vec![MAX; height]; width]
}

#[cfg(test)]
mod tests {}
