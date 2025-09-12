use {
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
};

static OCTOCRAB: OnceLock<Octocrab> = OnceLock::new();

fn get_octocrab() -> &'static Octocrab {
  OCTOCRAB.get_or_init(|| {
    Octocrab::builder()
      .personal_token(dotenv!("GITHUB_ACCESS_TOKEN").to_string())
      .build()
      .expect("Failed to build Octocrab instance")
  })
}

#[macro_use]
extern crate dotenv_codegen;

type Result<T = (), E = Error> = std::result::Result<T, E>;

#[derive(Debug, Serialize)]
struct Plugin {
  name: String,
  description: Option<String>,
  created_at: Option<DateTime<Utc>>,
  stars: u32,
  topics: Option<Vec<String>>,
  updated_at: Option<DateTime<Utc>>,
  url: String,
  watchers: u32,
}

#[async_trait]
impl AsyncTryFrom<Repository> for Plugin {
  type Error = Error;

  async fn async_try_from(repository: Repository) -> Result<Self, Self::Error> {
    let octocrab = get_octocrab();

    let fetched_repository = octocrab
      .repos(&repository.user, &repository.name)
      .get()
      .await?;

    Ok(Plugin {
      name: fetched_repository.name,
      description: fetched_repository.description,
      topics: fetched_repository.topics,
      created_at: fetched_repository.created_at,
      stars: fetched_repository.stargazers_count.unwrap_or(0),
      updated_at: fetched_repository.updated_at,
      url: format!(
        "https://github.com/{}/{}",
        repository.user, repository.name
      ),
      watchers: fetched_repository.watchers_count.unwrap_or(0),
    })
  }
}

#[derive(Clone, Debug)]
struct Repository {
  name: String,
  user: String,
}

impl Repository {
  async fn readme(&self) -> Result<String> {
    let octocrab = get_octocrab();

    let mut content = octocrab
      .repos(self.user.clone(), self.name.clone())
      .get_content()
      .path("README.md")
      .send()
      .await?;

    let contents = content.take_items();

    Ok(
      contents
        .first()
        .ok_or(anyhow!("No readme found"))?
        .decoded_content()
        .ok_or(anyhow!("Failed to get decoded readme content"))?,
    )
  }
}

#[derive(Clap, Debug)]
struct Arguments {
  #[clap(short, long, default_value = "plugins.json")]
  output: PathBuf,
}

impl Arguments {
  async fn run(self) -> Result {
    let repository = Repository {
      name: "awesome-neovim".into(),
      user: "rockerBOO".into(),
    };

    let repositories = Self::parse_readme(repository.readme().await?).await?;

    let mut plugins = Vec::new();

    for repository in repositories {
      match Plugin::async_try_from(repository.clone()).await {
        Ok(plugin) => {
          println!("✓ {}", plugin.name);
          plugins.push(plugin);
        }
        Err(error) => {
          println!("𐄂 {}: {error}", repository.name)
        }
      }
    }

    fs::write(self.output, serde_json::to_string(&plugins)?)?;

    Ok(())
  }

  async fn parse_readme(content: String) -> Result<Vec<Repository>> {
    let parser = Parser::new(&content);

    let mut repositories = Vec::new();

    let mut current_header = None;
    let mut in_list = false;
    let mut current_item_text = String::new();
    let mut collecting_item = false;

    for event in parser {
      match event {
        Event::Start(Tag::Heading { .. }) => {
          current_header = None;
        }
        Event::Text(text) if current_header.is_none() => {
          current_header = Some(text.to_string());
        }
        Event::Start(Tag::List(_)) => {
          in_list = true;
        }
        Event::End(TagEnd::List(_)) => {
          in_list = false;
        }
        Event::Start(Tag::Item) if in_list => {
          collecting_item = true;
          current_item_text.clear();
        }
        Event::End(TagEnd::Item) if collecting_item => {
          if !current_item_text.trim().is_empty() {
            let re = Regex::new(r"([^/\s]+)/([^/\s)]+)").unwrap();

            if let Some(captures) = re.captures(&current_item_text) {
              let user = captures.get(1).unwrap().as_str();

              let repo = captures.get(2).unwrap().as_str();

              repositories.push(Repository {
                user: user.into(),
                name: repo.into(),
              });
            }
          }

          collecting_item = false;
        }
        Event::Text(text) if collecting_item => {
          current_item_text.push_str(&text);
        }
        _ => {}
      }
    }

    Ok(repositories)
  }
}

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
