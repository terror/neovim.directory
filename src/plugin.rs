use super::*;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
#[typeshare]
pub(crate) struct Plugin {
  pub(crate) name: String,
  pub(crate) description: Option<String>,
  #[typeshare(serialized_as = "Option<String>")]
  pub(crate) created_at: Option<DateTime<Utc>>,
  pub(crate) stars: u32,
  pub(crate) topics: Option<Vec<String>>,
  #[typeshare(serialized_as = "Option<String>")]
  pub(crate) updated_at: Option<DateTime<Utc>>,
  pub(crate) url: String,
  pub(crate) watchers: u32,
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
