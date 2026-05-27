use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct Request {
    pub source: String,
    pub source_lang: String,
    pub target_lang: String,
    pub source_version: Option<String>,
    pub target_version: Option<String>,
    pub gemini_key: Option<String>,
    pub cohere_key: Option<String>,
    pub gemini_model: Option<String>,
    pub cohere_model: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct Response {
    pub result: String,
    pub lines_input: usize,
    pub lines_output: usize,
    pub method: String,
}

pub async fn run(req: Request) -> Result<Response, String> {
    let lines_input = count_lines(&req.source);
    let source_lang = if req.source_lang.is_empty() {
        let detected = crate::detect::detect_language(&req.source);
        tracing::info!(source_lang = %detected, "language auto-detected");
        detected
    } else {
        crate::languages::normalize(&req.source_lang)
    };
    let target_lang = crate::languages::normalize(&req.target_lang);

    tracing::info!(source_lang = %source_lang, target_lang = %target_lang, lines = lines_input, "translate start");

    // 1. Try cache
    if let Some(cached) = crate::cache::get(&req.source, &source_lang, &target_lang) {
        let lines_output = count_lines(&cached);
        tracing::info!("cache HIT");
        return Ok(Response {
            result: cached,
            lines_input,
            lines_output,
            method: "cache".to_string(),
        });
    }
    tracing::info!("cache MISS");

    // 2. Try AI cascade
    let mut last_error = String::new();

    if let Some(key) = &req.gemini_key {
        if !key.is_empty() {
            let model = req.gemini_model.as_deref().unwrap_or("gemini-2.0-flash");
            tracing::info!(model = %model, "trying gemini");
            match crate::ai::gemini_translate(&req.source, &source_lang, &target_lang, key, model).await {
                Ok(text) => {
                    let lines_output = count_lines(&text);
                    crate::cache::set(&req.source, &source_lang, &target_lang, &text);
                    tracing::info!("gemini SUCCESS");
                    return Ok(Response {
                        result: text,
                        lines_input,
                        lines_output,
                        method: format!("gemini:{}", model),
                    });
                }
                Err(e) => {
                    tracing::warn!("gemini FAILED: {}", e);
                    last_error = format!("gemini: {}", e);
                }
            }
        }
    }

    if let Some(key) = &req.cohere_key {
        if !key.is_empty() {
            let model = req.cohere_model.as_deref().unwrap_or("command-r");
            tracing::info!(model = %model, "trying cohere");
            match crate::ai::cohere_translate(&req.source, &source_lang, &target_lang, key, model).await {
                Ok(text) => {
                    let lines_output = count_lines(&text);
                    crate::cache::set(&req.source, &source_lang, &target_lang, &text);
                    tracing::info!("cohere SUCCESS");
                    return Ok(Response {
                        result: text,
                        lines_input,
                        lines_output,
                        method: format!("cohere:{}", model),
                    });
                }
                Err(e) => {
                    tracing::warn!("cohere FAILED: {}", e);
                    last_error = format!("cohere: {}", e);
                }
            }
        }
    }

    // 3. Try rules-based
    tracing::info!("trying rules");
    match crate::rules::translate(&req.source, &source_lang, &target_lang) {
        Some(text) => {
            let lines_output = count_lines(&text);
            crate::cache::set(&req.source, &source_lang, &target_lang, &text);
            tracing::info!("rules SUCCESS");
            return Ok(Response {
                result: text,
                lines_input,
                lines_output,
                method: "rules".to_string(),
            });
        }
        None => {
            tracing::warn!("rules no match");
            last_error = format!("rules: no match, last: {}", last_error);
        }
    }

    tracing::error!("translate FAILED: {}", last_error);
    Err(last_error)
}

fn count_lines(s: &str) -> usize {
    if s.is_empty() { 0 } else { s.lines().count() }
}
