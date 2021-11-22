pub struct GameState {
    pub board: GameBoard,
    pub turn_index: usize,
    pub player_turn_order: Vec<String>,
}
impl GameState {
    pub fn new(board_width: usize, board_height: usize) -> GameState {
        GameState {
            board: create_game_board(board_width, board_height),
            player_turn_order: vec![],
            turn_index: 0,
        }
    }
}

type GameBoard = Vec<Vec<usize>>;
fn create_game_board(width: usize, height: usize) -> GameBoard {
    vec![vec![0; width]; height]
}

#[cfg(test)]
mod tests {}
