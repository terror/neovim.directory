use {
  crate::{
    arguments::Arguments, plugin::Plugin, repository::Repository,
    subcommand::Subcommand,
  },
  anyhow::{Error, anyhow},
  async_from::{AsyncTryFrom, async_trait},
  chrono::{DateTime, Utc},
  clap::Parser as Clap,
  dotenv::dotenv,
  octocrab::Octocrab,
  pulldown_cmark::{Event, Parser, Tag, TagEnd},
  regex::Regex,
  serde::Serialize,
  std::{
    backtrace::BacktraceStatus, fs, path::PathBuf, process, sync::OnceLock,
  },
  typeshare::typeshare,
};

#[macro_use]
extern crate dotenv_codegen;

mod arguments;
mod plugin;
mod repository;
mod subcommand;

static OCTOCRAB: OnceLock<Octocrab> = OnceLock::new();

fn get_octocrab() -> &'static Octocrab {
  OCTOCRAB.get_or_init(|| {
    Octocrab::builder()
      .personal_token(dotenv!("GITHUB_ACCESS_TOKEN").to_string())
      .build()
      .expect("Failed to build Octocrab instance")
  })
}

type Result<T = (), E = Error> = std::result::Result<T, E>;

#[tokio::main]
async fn main() {
  dotenv().ok();

  if let Err(error) = Arguments::parse().run().await {
    eprintln!("error: {error}");

    for (i, error) in error.chain().skip(1).enumerate() {
      if i == 0 {
        eprintln!();
        eprintln!("because:");
      }

      eprintln!("- {error}");
    }

    let backtrace = error.backtrace();

    if backtrace.status() == BacktraceStatus::Captured {
      eprintln!("backtrace:");
      eprintln!("{backtrace}");
    }

    process::exit(1);
  }
}
