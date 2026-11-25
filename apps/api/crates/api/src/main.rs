//! The binary of the API.
//!
//! ```text
//! api                  serve the API (the same as `api serve`)
//! api migrate          apply the pending migrations, then exit
//! api openapi <file>   write the OpenAPI document to <file>
//! ```
//!
//! Reads `DATABASE_URL`, `API_ADDRESS`, `LOG_FORMAT` and `RUST_LOG` from the
//! environment, or from the `.env` file of the repository. Everything it says goes
//! through the logs, on the standard output.

use std::env;
use std::process::ExitCode;

use api::logging::{self, LogFormat};
use api::state::AppState;
use infrastructure::database::{self, DatabaseError};

const DEFAULT_ADDRESS: &str = "127.0.0.1:8080";

#[derive(Debug, thiserror::Error)]
enum CommandError {
    #[error("usage: api [serve | migrate | openapi <file>]")]
    Usage,
    #[error("{0} is not set: copy .env.example to .env")]
    MissingVariable(&'static str),
    #[error(transparent)]
    Database(#[from] DatabaseError),
    #[error("cannot generate the OpenAPI document: {0}")]
    OpenApi(#[from] serde_json::Error),
    #[error(transparent)]
    Io(#[from] std::io::Error),
}

#[tokio::main]
async fn main() -> ExitCode {
    // A missing .env is not an error: the variables may come from the environment.
    let _ = dotenvy::dotenv();

    match LogFormat::from_variable(env::var("LOG_FORMAT").ok().as_deref()) {
        Ok(format) => logging::init(format),
        Err(error) => {
            // The one message that cannot be logged: the logs are not started yet.
            #[allow(clippy::print_stderr)]
            {
                eprintln!("error: {error}");
            }
            return ExitCode::FAILURE;
        }
    }

    let args: Vec<String> = env::args().skip(1).collect();
    let args: Vec<&str> = args.iter().map(String::as_str).collect();
    let result = match args.as_slice() {
        [] | ["serve"] => serve().await,
        ["migrate"] => migrate().await,
        ["openapi", file] => write_openapi(file),
        _ => Err(CommandError::Usage),
    };

    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            tracing::error!(%error, "command failed");
            ExitCode::FAILURE
        }
    }
}

async fn serve() -> Result<(), CommandError> {
    let pool = database::connect(&database_url()?)?;
    let address = env::var("API_ADDRESS").unwrap_or_else(|_| DEFAULT_ADDRESS.to_owned());

    let listener = tokio::net::TcpListener::bind(&address).await?;
    tracing::info!(%address, "API listening");
    axum::serve(listener, api::router(AppState::new(pool)))
        .with_graceful_shutdown(shutdown_signal())
        .await?;
    Ok(())
}

async fn migrate() -> Result<(), CommandError> {
    let pool = database::connect(&database_url()?)?;
    database::migrate(&pool).await?;
    tracing::info!("migrations applied");
    Ok(())
}

fn write_openapi(file: &str) -> Result<(), CommandError> {
    std::fs::write(file, api::openapi::to_json()?)?;
    tracing::info!(file, "OpenAPI document written");
    Ok(())
}

fn database_url() -> Result<String, CommandError> {
    env::var("DATABASE_URL").map_err(|_| CommandError::MissingVariable("DATABASE_URL"))
}

/// Resolves on Ctrl+C, so the server finishes the requests in progress before it stops.
async fn shutdown_signal() {
    let _ = tokio::signal::ctrl_c().await;
}
