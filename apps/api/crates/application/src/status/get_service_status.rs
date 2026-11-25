use domain::status::{DatabaseProbe, ServiceStatus};

/// Use case: tells whether the service and the components it depends on are up.
///
/// It reads no business data, so it takes no `CurrentUser`: the status answers
/// before anyone signs in.
#[derive(Debug, Clone)]
pub struct GetServiceStatus<P> {
    database: P,
}

impl<P: DatabaseProbe> GetServiceStatus<P> {
    pub fn new(database: P) -> Self {
        Self { database }
    }

    pub async fn execute(&self) -> ServiceStatus {
        todo!()
    }
}

#[cfg(test)]
mod tests {
    use domain::status::ComponentStatus;

    use super::*;

    /// In-memory fake of the port: answers the status it was given.
    struct FakeDatabase(ComponentStatus);

    impl DatabaseProbe for FakeDatabase {
        async fn check(&self) -> ComponentStatus {
            self.0
        }
    }

    #[tokio::test]
    async fn the_service_is_up_when_the_database_answers() {
        let use_case = GetServiceStatus::new(FakeDatabase(ComponentStatus::Up));

        let status = use_case.execute().await;

        assert_eq!(status.database, ComponentStatus::Up);
        assert_eq!(status.overall(), ComponentStatus::Up);
    }

    #[tokio::test]
    async fn the_service_is_down_when_the_database_does_not_answer() {
        let use_case = GetServiceStatus::new(FakeDatabase(ComponentStatus::Down));

        let status = use_case.execute().await;

        assert_eq!(status.database, ComponentStatus::Down);
        assert_eq!(status.overall(), ComponentStatus::Down);
    }
}
