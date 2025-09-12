use super::*;

#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub(crate) struct Repository {
  pub(crate) name: String,
  pub(crate) user: String,
}

impl Repository {
  pub(crate) async fn readme(&self) -> Result<String> {
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
