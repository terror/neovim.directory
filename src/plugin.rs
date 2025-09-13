use super::*;

#[derive(Clone, Debug, Deserialize, Eq, Hash, Serialize)]
#[serde(rename_all = "camelCase")]
#[typeshare]
pub(crate) struct Plugin {
  pub(crate) name: String,
  #[typeshare(serialized_as = "Option<String>")]
  pub(crate) created_at: Option<DateTime<Utc>>,
  pub(crate) description: Option<String>,
  pub(crate) stars: u32,
  pub(crate) topics: Option<Vec<String>>,
  #[typeshare(serialized_as = "Option<String>")]
  pub(crate) updated_at: Option<DateTime<Utc>>,
  pub(crate) user: String,
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
      created_at: fetched_repository.created_at,
      description: fetched_repository.description,
      stars: fetched_repository.stargazers_count.unwrap_or(0),
      topics: fetched_repository.topics,
      updated_at: fetched_repository.updated_at,
      user: repository.user,
      watchers: fetched_repository
        .subscribers_count
        .unwrap_or(0)
        .try_into()?,
    })
  }
}

impl Into<Repository> for Plugin {
  fn into(self) -> Repository {
    Repository {
      name: self.name,
      user: self.user,
    }
  }
}

impl PartialEq for Plugin {
  fn eq(&self, other: &Self) -> bool {
    self.name == other.name && self.user == other.user
  }
}
