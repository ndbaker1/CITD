use std::usize::MAX;

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
                Ok(self.find_connected(4, player_index))
            }
            // error
            None => Err(format!(
                "player {} cannot play in column {} because it is full.",
                self.player_turn_order[player_index], column_index
            )),
        }
    }

    fn find_connected(&self, length: usize, player_index: usize) -> bool {
        false
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
