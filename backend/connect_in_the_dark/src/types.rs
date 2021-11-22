#[derive(Clone)]
pub struct GameState {
    pub board: GameBoard,
    pub turn_index: usize,
    pub player_turn_order: Vec<String>,
}

impl GameState {
    /// set the value of a given cell in the grid
    pub fn play(&mut self, column: usize, player_index: usize) -> Result<(), String> {
        match self.board[column].iter().position(|id| *id == 0) {
            // update the owner of the grid cell
            Some(play_index) => Ok(self.board[column][play_index] = player_index),
            // error
            None => Err(format!(
                "player {} cannot play in column {} because it is full.",
                self.player_turn_order[player_index], column
            )),
        }
    }
}

type GameBoard = Vec<Vec<usize>>;
/// Create the 2D grid board for a Game
pub fn create_game_board(width: usize, height: usize) -> GameBoard {
    vec![vec![0; width]; height]
}

#[cfg(test)]
mod tests {}
