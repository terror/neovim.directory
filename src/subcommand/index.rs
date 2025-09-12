use super::*;

#[derive(Clap, Debug)]
pub(crate) struct Index {
  #[clap(short, long, default_value = PLUGIN_FILE_PATH)]
  output: PathBuf,
}

impl Index {
  pub(crate) async fn run(self) -> Result {
    let existing_plugins = if self.output.exists() {
      serde_json::from_str::<Vec<Plugin>>(&fs::read_to_string(&self.output)?)?
    } else {
      Vec::new()
    };

    let repository = Repository {
      name: "awesome-neovim".into(),
      user: "rockerBOO".into(),
    };

    let mut repositories =
      Self::parse_readme(repository.readme().await?).await?;

    let preserved_repositories = existing_plugins
      .into_iter()
      .map(|plugin| plugin.into())
      .filter(|repository| !repositories.contains(repository))
      .collect::<Vec<Repository>>();

    for preserved_repository in preserved_repositories {
      repositories.insert(preserved_repository);
    }

    let mut indexed_plugins = HashSet::new();

    for repository in repositories {
      match Plugin::async_try_from(repository.clone()).await {
        Ok(plugin) if !indexed_plugins.contains(&plugin) => {
          println!("✓ {}/{}", plugin.user, plugin.name);
          indexed_plugins.insert(plugin);
        }
        Ok(_) => {}
        Err(error) => {
          println!("𐄂 {}/{}: {error}", repository.user, repository.name)
        }
      }
    }

    fs::write(self.output, serde_json::to_string(&indexed_plugins)?)?;

    Ok(())
  }

  async fn parse_readme(content: String) -> Result<HashSet<Repository>> {
    let parser = Parser::new(&content);

    let mut repositories = HashSet::new();

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

              repositories.insert(Repository {
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
