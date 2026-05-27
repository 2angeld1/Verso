use regex::Regex;

pub fn translate(source: &str, source_lang: &str, target_lang: &str) -> Option<String> {
    match (source_lang.to_lowercase().as_str(), target_lang.to_lowercase().as_str()) {
        ("php", "php") => Some(php_to_php(source)),
        ("javascript", "typescript") | ("js", "typescript") => Some(js_to_ts(source)),
        ("html", "tsx") | ("html", "react") => Some(html_to_tsx(source)),
        _ => None,
    }
}

fn php_to_php(source: &str) -> String {
    let mut result = source.to_string();

    let re = Regex::new(r"(?m)\barray\s*\(([\s\S]*?)\)\s*;").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let inner = &caps[1];
        let items: Vec<&str> = inner.split(',').map(|s| s.trim()).collect();
        format!("[{}];", items.join(", "))
    }).to_string();

    if !result.contains("declare(strict_types=1)") {
        result = format!("<?php\ndeclare(strict_types=1);\n\n{}", result.trim_start_matches("<?php").trim());
    }

    result
}

fn js_to_ts(source: &str) -> String {
    let mut result = source.to_string();

    // Add explicit types to function parameters
    let re = Regex::new(r"(?m)(function\s+\w+\s*\(([^)]*)\))").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let sig = &caps[1];
        let params = &caps[2];
        if params.trim().is_empty() {
            return sig.to_string();
        }
        let typed_params: Vec<String> = params.split(',')
            .map(|p| {
                let p = p.trim();
                if p.contains(':') { p.to_string() } else { format!("{}: any", p) }
            })
            .collect();
        sig.replacen(params, &typed_params.join(", "), 1)
    }).to_string();

    // Add types to arrow function params
    let re = Regex::new(r"(?m)(\(([^)]*)\)\s*=>)").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let params = &caps[2];
        if params.trim().is_empty() {
            return caps[0].to_string();
        }
        let typed_params: Vec<String> = params.split(',')
            .map(|p| {
                let p = p.trim();
                if p.contains(':') { p.to_string() } else { format!("{}: any", p) }
            })
            .collect();
        caps[0].replacen(params, &typed_params.join(", "), 1)
    }).to_string();

    // Add return type to functions
    let re = Regex::new(r"(?m)(function\s+\w+\s*\([^)]*\))\s*\{").unwrap();
    result = re.replace_all(&result, "$1: any {").to_string();

    // Use const/let instead of var
    let re = Regex::new(r"(?m)\bvar\s+").unwrap();
    result = re.replace_all(&result, "let ").to_string();

    // Remove CommonJS require -> use import
    let re = Regex::new(r#"(?m)(const|let)\s+(\w+)\s*=\s*require\s*\(['"]([^'"]+)['"]\)"#).unwrap();
    result = re.replace_all(&result, "import $2 from '$3'").to_string();

    if !result.contains("export ") && result.contains("module.exports") {
        result = result.replace("module.exports", "export default");
    } else if !result.contains("export ") && result.contains("function ") {
        let re = Regex::new(r"(?m)^(function\s+\w+)").unwrap();
        if let Some(cap) = re.captures(&result) {
            result = result.replacen(&cap[1], &format!("export {}", &cap[1]), 1);
        }
    }

    result
}

fn html_to_tsx(source: &str) -> String {
    let mut result = source.to_string();

    // class -> className
    let re = Regex::new(r##"\bclass\s*="(?![^"]*\{)"##).unwrap();
    result = re.replace_all(&result, "className=").to_string();

    // for -> htmlFor
    let re = Regex::new(r##"\bfor\s*="(?![^"]*\{)"##).unwrap();
    result = re.replace_all(&result, "htmlFor=").to_string();

    // Self-close void elements
    let void_elements = ["br", "hr", "img", "input", "meta", "link", "area", "base", "col", "embed", "source", "track", "wbr"];
    for el in &void_elements {
        let re = Regex::new(&format!(r"(?m)<{}([^>]*[^/])>\s*</{}>", el, el)).unwrap();
        result = re.replace_all(&result, |_: &regex::Captures| format!("<{} />", el)).to_string();
    }

    // Wrap in a React fragment if there are multiple root elements
    let root_count = result.trim().matches("<").count() - result.trim().matches("</").count();
    if root_count > 2 {
        result = format!("<>\n{}\n</>", result);
    }

    result
}
