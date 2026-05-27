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
        crate::detect::detect_language(&req.source)
    } else {
        req.source_lang.clone()
    };

    // 1. Try cache
    if let Some(cached) = crate::cache::get(&req.source, &source_lang, &req.target_lang) {
        let lines_output = count_lines(&cached);
        return Ok(Response {
            result: cached,
            lines_input,
            lines_output,
            method: "cache".to_string(),
        });
    }

    // 2. Try AI cascade
    let mut last_error = String::new();

    if let Some(key) = &req.gemini_key {
        if !key.is_empty() {
            let model = req.gemini_model.as_deref().unwrap_or("gemini-2.0-flash");
            match crate::ai::gemini_translate(&req.source, &source_lang, &req.target_lang, key, model).await {
                Ok(text) => {
                    let lines_output = count_lines(&text);
                    crate::cache::set(&req.source, &source_lang, &req.target_lang, &text);
                    return Ok(Response {
                        result: text,
                        lines_input,
                        lines_output,
                        method: format!("gemini:{}", model),
                    });
                }
                Err(e) => last_error = format!("gemini: {}", e),
            }
        }
    }

    if let Some(key) = &req.cohere_key {
        if !key.is_empty() {
            let model = req.cohere_model.as_deref().unwrap_or("command-r");
            match crate::ai::cohere_translate(&req.source, &source_lang, &req.target_lang, key, model).await {
                Ok(text) => {
                    let lines_output = count_lines(&text);
                    crate::cache::set(&req.source, &source_lang, &req.target_lang, &text);
                    return Ok(Response {
                        result: text,
                        lines_input,
                        lines_output,
                        method: format!("cohere:{}", model),
                    });
                }
                Err(e) => last_error = format!("cohere: {}", e),
            }
        }
    }

    // 3. Try rules-based
    match crate::rules::translate(&req.source, &source_lang, &req.target_lang) {
        Some(text) => {
            let lines_output = count_lines(&text);
            crate::cache::set(&req.source, &source_lang, &req.target_lang, &text);
            return Ok(Response {
                result: text,
                lines_input,
                lines_output,
                method: "rules".to_string(),
            });
        }
        None => last_error = format!("rules: no match, last: {}", last_error),
    }

    Err(last_error)
}

fn count_lines(s: &str) -> usize {
    if s.is_empty() { 0 } else { s.lines().count() }
}
