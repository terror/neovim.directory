use {
  super::*,
  crate::subcommand::{add::Add, index::Index},
};

mod add;
mod index;

#[derive(Clap, Debug)]
pub(crate) enum Subcommand {
  #[clap(about = "Add a new custom plugin")]
  Add(Add),
  #[clap(about = "Build the plugin index")]
  Index(Index),
}

impl Subcommand {
  pub(crate) async fn run(self) -> Result {
    match self {
      Self::Add(add) => add.run().await,
      Self::Index(index) => index.run().await,
    }
  }
}
