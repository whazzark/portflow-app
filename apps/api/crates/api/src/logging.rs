//! The logs of the API: one line per request, with an identifier of the request that
//! every event logged while it is handled inherits. The rules of what a feature may
//! log are in `.claude/rules/backend.md` (Logging).

use std::time::Duration;

use axum::Router;
use axum::extract::Request;
use axum::http::HeaderName;
use axum::response::Response;
use tower_http::request_id::{
    MakeRequestUuid, PropagateRequestIdLayer, RequestId, SetRequestIdLayer,
};
use tower_http::trace::TraceLayer;
use tracing::Span;
use tracing_subscriber::EnvFilter;

/// The header that carries the identifier of a request, in the response.
const REQUEST_ID: HeaderName = HeaderName::from_static("x-request-id");

/// Gives each request an identifier and logs it once, when its response is ready.
///
/// A layer wraps the ones added before it, so the last one below is the first to see
/// the request. In the order a request meets them:
///
/// 1. the identifier a client may have sent is dropped: it is not trusted, and would
///    let the client write what it wants in the logs;
/// 2. the server gives the request its identifier, a random UUID;
/// 3. the request is logged when its response is ready, whatever answered it: a
///    handler, an unknown route, or a handler that panicked;
/// 4. the identifier is copied to the response.
pub fn log_requests(routes: Router) -> Router {
    routes
        .layer(PropagateRequestIdLayer::new(REQUEST_ID))
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(request_span)
                .on_request(())
                .on_response(log_response)
                .on_body_chunk(())
                .on_eos(())
                .on_failure(()),
        )
        .layer(SetRequestIdLayer::new(REQUEST_ID, MakeRequestUuid))
        .layer(axum::middleware::map_request(
            drop_the_identifier_of_the_client,
        ))
}

async fn drop_the_identifier_of_the_client(mut request: Request) -> Request {
    request.headers_mut().remove(REQUEST_ID);
    request
}

/// The context of a request: every event logged while it is handled carries these
/// fields. The path comes without its query string, and no header is recorded: they
/// may hold credentials.
///
/// The span has the error level so that it is never filtered out: an error logged
/// with `RUST_LOG=error` still says which request it belongs to.
fn request_span(request: &Request) -> Span {
    let request_id = request
        .extensions()
        .get::<RequestId>()
        .and_then(|id| id.header_value().to_str().ok())
        .unwrap_or_default();

    tracing::error_span!(
        "request",
        method = %request.method(),
        path = request.uri().path(),
        request_id,
    )
}

/// The one line of a request. A server error is logged as an error, anything else as
/// information: a client error is an expected answer.
fn log_response(response: &Response, duration: Duration, _span: &Span) {
    let status = response.status().as_u16();
    let duration_ms = u64::try_from(duration.as_millis()).unwrap_or(u64::MAX);

    if response.status().is_server_error() {
        tracing::error!(status, duration_ms, "request completed");
    } else {
        tracing::info!(status, duration_ms, "request completed");
    }
}

/// The level of the logs when `RUST_LOG` is not set, or cannot be read.
const DEFAULT_LEVEL: &str = "info";

/// How the logs are written: for a person in local development, for a machine elsewhere.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogFormat {
    /// One readable line per event.
    Pretty,
    /// One JSON object per line.
    Json,
}

#[derive(Debug, PartialEq, Eq, thiserror::Error)]
#[error("LOG_FORMAT is `{0}`: it must be `pretty` or `json`")]
pub struct UnknownLogFormat(String);

impl LogFormat {
    /// Reads the value of `LOG_FORMAT`. Without a value the format is JSON: only a
    /// developer's `.env` asks for the readable one.
    pub fn from_variable(value: Option<&str>) -> Result<Self, UnknownLogFormat> {
        match value {
            None | Some("json") => Ok(Self::Json),
            Some("pretty") => Ok(Self::Pretty),
            Some(other) => Err(UnknownLogFormat(other.to_owned())),
        }
    }
}

/// Starts writing the logs to the standard output, at the level of `RUST_LOG`. Call
/// it once, when the binary starts.
pub fn init(format: LogFormat) {
    let level = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new(DEFAULT_LEVEL));
    let logs = tracing_subscriber::fmt().with_env_filter(level);

    match format {
        LogFormat::Pretty => logs.init(),
        // The fields of an event at the top of the object, and its request under `span`.
        LogFormat::Json => logs.json().flatten_event(true).with_span_list(false).init(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_format_is_json_unless_the_variable_asks_for_the_readable_one() {
        assert_eq!(LogFormat::from_variable(None), Ok(LogFormat::Json));
        assert_eq!(LogFormat::from_variable(Some("json")), Ok(LogFormat::Json));
        assert_eq!(
            LogFormat::from_variable(Some("pretty")),
            Ok(LogFormat::Pretty)
        );
    }

    #[test]
    fn an_unknown_format_is_refused() {
        let error = LogFormat::from_variable(Some("xml")).unwrap_err();

        assert_eq!(
            error.to_string(),
            "LOG_FORMAT is `xml`: it must be `pretty` or `json`"
        );
    }
}
