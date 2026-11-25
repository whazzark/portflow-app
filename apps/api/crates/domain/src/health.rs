//! Health of the service: whether the API reaches what it depends on. A technical
//! module without any rule of the business, not a bounded context.

use std::future::Future;

/// Whether a component answers.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ComponentStatus {
    Up,
    Down,
}

/// Health of the service and of each component it depends on.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ServiceHealth {
    pub database: ComponentStatus,
}

impl ServiceHealth {
    /// The service is up when every component it depends on is up.
    pub fn overall(&self) -> ComponentStatus {
        self.database
    }
}

/// Port: checks that the database answers.
pub trait DatabaseProbe {
    /// Never fails: a database that cannot be reached is `Down`.
    fn check(&self) -> impl Future<Output = ComponentStatus> + Send;
}
