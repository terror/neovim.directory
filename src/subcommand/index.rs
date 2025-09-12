use super::*;

#[derive(Clap, Debug)]
pub(crate) struct Index {
  #[clap(short, long, default_value = "plugins.json")]
  output: PathBuf,
}

impl Index {
  pub(crate) async fn run(self) -> Result {
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
