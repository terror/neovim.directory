use super::*;

#[derive(Clap, Debug)]
pub(crate) struct Arguments {
  #[clap(subcommand)]
  subcommand: Subcommand,
}

impl Arguments {
  pub(crate) async fn run(self) -> Result {
    self.subcommand.run().await
  }
}
