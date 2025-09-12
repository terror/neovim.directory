use {
  super::*,
  crate::{plugin::Plugin, repository::Repository},
  async_from::AsyncTryFrom,
  std::{fs, path::Path},
};

#[derive(Clap, Debug)]
pub(crate) struct Add {
  #[clap(help = "GitHub repository in user/repo format (e.g., foo/bar)")]
  repository: String,
}

impl Add {
  pub(crate) async fn run(self) -> Result {
    let parts = self.repository.split('/').collect::<Vec<&str>>();

    if parts.len() != 2 || parts[0].is_empty() || parts[1].is_empty() {
      return Err(anyhow!(
        "Repository must be in user/repo format (e.g., foo/bar)"
      ));
    }

    let (user, name) = (parts[0].to_string(), parts[1].to_string());

    let repository = Repository { user, name };

    let plugin = Plugin::async_try_from(repository).await?;

    let mut plugins = if Path::new(PLUGIN_FILE_PATH).exists() {
      serde_json::from_str::<Vec<Plugin>>(&fs::read_to_string(
        PLUGIN_FILE_PATH,
      )?)?
    } else {
      Vec::new()
    };

    if plugins.contains(&plugin) {
      return Ok(());
    }

    plugins.push(plugin.clone());

    fs::write(PLUGIN_FILE_PATH, serde_json::to_string_pretty(&plugins)?)?;

    println!("🎉 Added plugin `{}/{}`", plugin.user, plugin.name);

    Ok(())
  }
}
