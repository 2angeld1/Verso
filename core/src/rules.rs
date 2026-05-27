use regex::Regex;

pub fn translate(source: &str, source_lang: &str, target_lang: &str) -> Option<String> {
    match (source_lang.to_lowercase().as_str(), target_lang.to_lowercase().as_str()) {
        ("php", "php") => Some(php_to_php(source)),
        ("javascript", "typescript") | ("js", "typescript") => Some(js_to_ts(source)),
        ("html", "tsx") | ("html", "react") => Some(html_to_tsx(source)),
        ("cobol", "java") => Some(cobol_to_java(source)),
        ("cobol", "csharp") => Some(cobol_to_csharp(source)),
        ("objectivec", "swift") => Some(objc_to_swift(source)),
        ("java", "kotlin") => Some(java_to_kotlin(source)),
        ("visualbasic", "csharp") | ("visualbasic", "c#") => Some(vb_to_csharp(source)),
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

fn cobol_to_java(source: &str) -> String {
    let mut result = source.to_string();

    // Extract PROGRAM-ID for class name
    let re = Regex::new(r"(?mi)^\s*PROGRAM-ID\.\s*(\w+)").unwrap();
    let class_name = re.captures(&result)
        .map(|c| capitalize(&c[1]))
        .unwrap_or_else(|| "LegacyProgram".to_string());

    // Remove IDENTIFICATION DIVISION
    let re = Regex::new(r"(?mi)^\s*IDENTIFICATION\s+DIVISION\.?\s*").unwrap();
    result = re.replace_all(&result, "").to_string();

    // Remove PROGRAM-ID line
    let re = Regex::new(r"(?mi)^\s*PROGRAM-ID\.\s*\w+\.?\s*").unwrap();
    result = re.replace_all(&result, "").to_string();

    // Remove DATA DIVISION header
    let re = Regex::new(r"(?mi)^\s*DATA\s+DIVISION\.?\s*").unwrap();
    result = re.replace_all(&result, "").to_string();

    // Remove WORKING-STORAGE SECTION header
    let re = Regex::new(r"(?mi)^\s*WORKING-STORAGE\s+SECTION\.?\s*").unwrap();
    result = re.replace_all(&result, "").to_string();

    // Remove LINKAGE SECTION header
    let re = Regex::new(r"(?mi)^\s*LINKAGE\s+SECTION\.?\s*").unwrap();
    result = re.replace_all(&result, "").to_string();

    // Convert level 01-49 and 77 data definitions with optional VALUE clause
    // 01 WS-NAME PIC X(20) VALUE 'something'. -> String wsName = "something";
    // 01 WS-NAME PIC X(20) VALUE SPACES.     -> String wsName = "";
    // 01 WS-NUM  PIC 9(4)  VALUE ZEROS.      -> int wsNum = 0;
    let re = Regex::new(
        r"(?mi)^\s*(0[1-9]|[1-4]\d|77)\s+(\w+(?:-\w+)*)\s+PIC\s+(\w+(?:\([\dV]+\))?)(?:\s+VALUE\s+(.+?))?\.?\s*$"
    ).unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let var_name = cobol_to_camel(&caps[2]);
        let pic = &caps[3];
        let java_type = pic_to_java_type(pic);
        let default = caps.get(4).map(|m| m.as_str().trim()).unwrap_or("");
        let init = match default {
            s if s.eq_ignore_ascii_case("SPACES") || s.eq_ignore_ascii_case("SPACE") =>
                if java_type == "String" { " = \"\"" } else { " = 0" },
            s if s.eq_ignore_ascii_case("ZERO") || s.eq_ignore_ascii_case("ZEROS") =>
                " = 0",
            s if s.starts_with('\'') && s.ends_with('\'') =>
                &format!(" = \"{}\"", &s[1..s.len()-1]),
            s if s.parse::<i64>().is_ok() =>
                &format!(" = {}", s),
            s if s.starts_with('"') && s.ends_with('"') =>
                &format!(" = {}", s),
            _ => "",
        };
        let comment = format!("{} {} PIC {}", &caps[1], &caps[2], pic);
        format!("{} {}{}; // {}", java_type, var_name, init, comment)
    }).to_string();

    // Remove PROCEDURE DIVISION header
    let re = Regex::new(r"(?mi)^\s*PROCEDURE\s+DIVISION\.?\s*").unwrap();
    result = re.replace_all(&result, "").to_string();

    // Remove PROCEDURE DIVISION USING ...
    let re = Regex::new(r"(?mi)^\s*PROCEDURE\s+DIVISION\s+USING\s+.*\.?\s*").unwrap();
    result = re.replace_all(&result, "").to_string();

    // Convert paragraph labels: paragraph-name.
    // Keep them as comments
    let re = Regex::new(r"(?mi)^\s*(\w+(?:-\w+)*)-(?:SECTION|section)?\.\s*$").unwrap();
    result = re.replace_all(&result, "// $1:").to_string();

    // MOVE a TO b -> b = a;
    let re = Regex::new(r"(?mi)^\s*MOVE\s+(.+?)\s+TO\s+(.+?)\.?\s*$").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let src = caps[1].trim();
        let dst = cobol_to_camel(caps[2].trim());
        if src == "SPACES" || src == "SPACE" {
            format!("{} = \"\";", dst)
        } else if src == "ZERO" || src == "ZEROS" {
            format!("{} = 0;", dst)
        } else {
            format!("{} = {};", dst, cobol_to_camel(src))
        }
    }).to_string();

    // ADD a TO b -> b += a;
    let re = Regex::new(r"(?mi)^\s*ADD\s+(.+?)\s+TO\s+(.+?)\.?\s*$").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        format!("{} += {};", cobol_to_camel(caps[2].trim()), cobol_to_camel(caps[1].trim()))
    }).to_string();

    // SUBTRACT a FROM b -> b -= a;
    let re = Regex::new(r"(?mi)^\s*SUBTRACT\s+(.+?)\s+FROM\s+(.+?)\.?\s*$").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        format!("{} -= {};", cobol_to_camel(caps[2].trim()), cobol_to_camel(caps[1].trim()))
    }).to_string();

    // MULTIPLY a BY b -> b *= a;
    let re = Regex::new(r"(?mi)^\s*MULTIPLY\s+(.+?)\s+BY\s+(.+?)\.?\s*$").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        format!("{} *= {};", cobol_to_camel(caps[2].trim()), cobol_to_camel(caps[1].trim()))
    }).to_string();

    // DIVIDE a INTO b -> b /= a;
    let re = Regex::new(r"(?mi)^\s*DIVIDE\s+(.+?)\s+INTO\s+(.+?)\.?\s*$").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        format!("{} /= {};", cobol_to_camel(caps[2].trim()), cobol_to_camel(caps[1].trim()))
    }).to_string();

    // COMPUTE a = expr -> a = expr;
    let re = Regex::new(r"(?mi)^\s*COMPUTE\s+(\w+(?:-\w+)*)\s*=\s*(.+)\.?\s*$").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let var = cobol_to_camel(&caps[1]);
        let expr = caps[2].trim();
        format!("{} = {};", var, expr)
    }).to_string();

    // IF cond ... ELSE ... END-IF
    let re = Regex::new(r"(?mi)^\s*IF\s+(.+?)\s+THEN\s*$").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        format!("if ({}) {{", caps[1].trim())
    }).to_string();

    let re = Regex::new(r"(?mi)^\s*IF\s+(.+?)\s*$").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let cond = caps[1].trim();
        let cond = cond.strip_suffix('.').unwrap_or(cond);
        format!("if ({}) {{", cond)
    }).to_string();

    let re = Regex::new(r"(?mi)^\s*ELSE\s*$").unwrap();
    result = re.replace_all(&result, "} else {").to_string();

    let re = Regex::new(r"(?mi)^\s*END-IF\.?\s*$").unwrap();
    result = re.replace_all(&result, "}").to_string();

    // PERFORM paragraph -> paragraph();
    let re = Regex::new(r"(?mi)^\s*PERFORM\s+(\w+(?:-\w+)*)\.?\s*$").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        format!("{}();", cobol_to_camel(&caps[1]))
    }).to_string();

    // PERFORM VARYING -> for loop (basic)
    let re = Regex::new(r"(?mi)^\s*PERFORM\s+VARYING\s+(\w+(?:-\w+)*)\s+FROM\s+(\d+)\s+BY\s+(\d+)\s+UNTIL\s+(.+?)\.?\s*$").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let var = cobol_to_camel(&caps[1]);
        let from = &caps[2];
        let by = &caps[3];
        let until = caps[4].trim().strip_suffix('.').unwrap_or(caps[4].trim());
        format!("for (int {} = {}; !({}); {} += {}) {{", var, from, until, var, by)
    }).to_string();

    // CALL 'prog' USING p1 p2 -> prog(p1, p2);
    let re = Regex::new(r"(?mi)^\s*CALL\s+'([^']+)'\s+USING\s+(.+?)\.?\s*$").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let prog = &caps[1];
        let params: Vec<String> = caps[2].split_whitespace()
            .map(|p| cobol_to_camel(p).to_string())
            .collect();
        format!("{}({});", prog.to_lowercase(), params.join(", "))
    }).to_string();

    // DISPLAY var -> System.out.println(var);
    let re = Regex::new(r"(?mi)^\s*DISPLAY\s+(.+?)\.?\s*$").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let arg = caps[1].trim();
        if arg.starts_with('\'') || arg.starts_with('"') {
            format!("System.out.println({});", arg)
        } else {
            format!("System.out.println({});", cobol_to_camel(arg))
        }
    }).to_string();

    // STOP RUN.
    let re = Regex::new(r"(?mi)^\s*STOP\s+RUN\.?\s*$").unwrap();
    result = re.replace_all(&result, "return;").to_string();

    // GOBACK.
    let re = Regex::new(r"(?mi)^\s*GOBACK\.?\s*$").unwrap();
    result = re.replace_all(&result, "return;").to_string();

    // EXIT PROGRAM.
    let re = Regex::new(r"(?mi)^\s*EXIT\s+PROGRAM\.?\s*$").unwrap();
    result = re.replace_all(&result, "return;").to_string();

    // END PROGRAM name.
    let re = Regex::new(r"(?mi)^\s*END\s+PROGRAM\s+\w+\.?\s*$").unwrap();
    result = re.replace_all(&result, "}").to_string();

    // INITIALIZE var -> var = null; (or 0 for primitives)
    let re = Regex::new(r"(?mi)^\s*INITIALIZE\s+(.+?)\.?\s*$").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let vars: Vec<String> = caps[1].split_whitespace()
            .map(|v| format!("{} = null;", cobol_to_camel(v)))
            .collect();
        vars.join("\n")
    }).to_string();

    // STRING a DELIMITED BY SIZE INTO b -> b = a;
    let re = Regex::new(r"(?mi)^\s*STRING\s+(.+?)\s+DELIMITED\s+BY\s+SIZE\s+INTO\s+(\w+(?:-\w+)*)\.?\s*$").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let parts: Vec<String> = caps[1].split_whitespace()
            .filter(|s| s != &" ")
            .map(|s| cobol_to_camel(s))
            .collect();
        format!("{} = {};", cobol_to_camel(&caps[2]), parts.join(" + "))
    }).to_string();

    // Clean up empty lines and wrap in class
    let lines: Vec<String> = result.lines()
        .map(|l| l.trim().to_string())
        .filter(|l| !l.is_empty() && !l.starts_with("       ") && l.trim() != ".")
        .collect();

    let body = lines.join("\n    ");

    format!("public class {} {{\n    public static void main(String[] args) {{\n    {}\n    }}\n}}", class_name, body)
}

fn cobol_to_csharp(source: &str) -> String {
    let mut result = cobol_to_java(source);

    // main signature first (before String -> string)
    let re = Regex::new(r"public static void main\(String\[\] args\)").unwrap();
    result = re.replace_all(&result, "public static void Main(string[] args)").to_string();

    // String -> string (C# convention), but not in Main
    let re = Regex::new(r"\bString\b").unwrap();
    result = re.replace_all(&result, "string").to_string();

    // System.out.println -> Console.WriteLine
    let re = Regex::new(r"System\.out\.println").unwrap();
    result = re.replace_all(&result, "Console.WriteLine").to_string();

    result
}

fn capitalize(s: &str) -> String {
    let mut c = s.chars();
    match c.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().to_string() + c.as_str().to_lowercase().as_str(),
    }
}

fn cobol_to_camel(s: &str) -> String {
    s.split(|c: char| c == '-' || c == '_')
        .enumerate()
        .map(|(i, part)| {
            if i == 0 {
                part.to_lowercase()
            } else {
                capitalize(part)
            }
        })
        .collect()
}

fn pic_to_java_type(pic: &str) -> &'static str {
    let upper = pic.to_uppercase();
    if upper.starts_with('X') || upper.starts_with('A') {
        "String"
    } else if upper.starts_with('9') {
        if upper.contains('V') {
            "double"
        } else if upper.contains("(10") || upper.contains("(9") {
            "long"
        } else {
            "int"
        }
    } else if upper.starts_with('S') && upper.contains('9') {
        if upper.contains('V') {
            "double"
        } else {
            "int"
        }
    } else {
        "String"
    }
}

fn objc_to_swift(source: &str) -> String {
    let mut result = source.to_string();

    // --- 1. Imports and preprocessor ---
    // #import <Framework/Header.h> -> import Framework
    let re = Regex::new(r"(?m)^\s*#import\s+<([^>]+)>").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let path = &caps[1];
        let framework = path.split('/').next().unwrap_or(path);
        format!("import {}", framework)
    }).to_string();
    let re = Regex::new(r#"(?m)^\s*#import\s+"[^"]+"\s*$"#).unwrap();
    result = re.replace_all(&result, "").to_string();
    let re = Regex::new(r"(?m)^\s*#(?:import|include|define|ifdef|ifndef|endif|pragma|undef)\s.*$").unwrap();
    result = re.replace_all(&result, "").to_string();

    // --- 2. Interface / implementation declarations ---
    // @interface ClassName : SuperClass <Protocol>
    let re = Regex::new(r"(?m)^\s*@interface\s+(\w+)\s*:\s*(\w+)(?:\s*<([^>]+)>)?\s*$").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let class_name = &caps[1];
        let super_name = &caps[2];
        let proto = caps.get(3).map(|m| m.as_str()).unwrap_or("");
        if proto.is_empty() {
            format!("class {}: {} {{", class_name, super_name)
        } else {
            format!("class {}: {}, {} {{", class_name, super_name, proto)
        }
    }).to_string();

    // @interface ClassName ()  —  extension
    let re = Regex::new(r"(?m)^\s*@interface\s+(\w+)\s*\(\s*\)\s*$").unwrap();
    result = re.replace_all(&result, "extension $1 {").to_string();

    // @interface ClassName (CategoryName) — not common in Swift, keep as extension
    let re = Regex::new(r"(?m)^\s*@interface\s+(\w+)\s*\((\w+)\)\s*$").unwrap();
    result = re.replace_all(&result, "// MARK: - $2\nextension $1 {").to_string();

    // @implementation ClassName
    let re = Regex::new(r"(?m)^\s*@implementation\s+\w+(?:\s*\(.*?\))?\s*$").unwrap();
    result = re.replace_all(&result, "").to_string();

    // @end — removed (class stays open; closed at end of function)
    let re = Regex::new(r"(?m)^\s*@end\s*$").unwrap();
    result = re.replace_all(&result, "").to_string();

    // @synthesize / @dynamic
    let re = Regex::new(r"(?m)^\s*@(synthesize|dynamic)\s+.*$").unwrap();
    result = re.replace_all(&result, "").to_string();

    // --- 3. Properties ---
    // @property (nonatomic, strong) Type *name;
    // @property Type name;
    // @property (readonly) Type name;
    let re = Regex::new(
        r"(?m)^\s*@property\s*(?:\(([^)]*)\))?\s*(?:IBOutlet\s+)?(.+?)\s*;\s*$"
    ).unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let attrs = caps.get(1).map(|a| a.as_str()).unwrap_or("");
        let decl = caps[2].trim();
        let is_readonly = attrs.contains("readonly");
        let kw = if is_readonly { "let" } else { "var" };
        // Split decl into type and name: last whitespace-delimited token is the name
        // ObjC convention: `NSString *name` has no space between * and name
        let mut tokens: Vec<&str> = decl.split_whitespace().collect();
        if tokens.len() >= 2 {
            let mut name = tokens.pop().unwrap_or("unknown").trim_start_matches('*').trim();
            // If the last token was just '*' (space on both sides), pop the actual name
            if name.is_empty() {
                name = tokens.pop().unwrap_or("unknown");
            }
            let typ_raw = tokens.join(" ");
            let swift_type = objc_type_to_swift(&typ_raw);
            // If type ends with * and name doesn't have one, reattach pointer to type
            let swift_type = if typ_raw.ends_with('*') && !swift_type.ends_with('*') {
                swift_type.to_string() // already handled in objc_type_to_swift
            } else {
                swift_type
            };
            format!("{} {}: {}", kw, name, swift_type)
        } else if tokens.len() == 1 {
            let name = tokens[0].trim_start_matches('*');
            format!("{} {}: Any", kw, name)
        } else {
            format!("{} unknown: Any", kw)
        }
    }).to_string();

    // Instance variables (_var -> self.var)
    // Match _identifier preceded by non-word char or line start
    let re = Regex::new(r"(^|[^.\w])_(\w+)\b").unwrap();
    result = re.replace_all(&result, "${1}self.${2}").to_string();

    // --- 4. Method declarations and implementations ---
    // Process by lines: remove declarations (end with ;), convert implementations (end with {)
    let mut lines: Vec<String> = Vec::new();
    for line in result.lines() {
        let trimmed = line.trim();
        // Remove lines matching ObjC method declarations: start with -/+ and end with ;
        if (trimmed.starts_with('-') || trimmed.starts_with('+'))
            && trimmed.contains('(')
            && trimmed.ends_with(';')
            && !trimmed.contains('@')
        {
            continue;
        }
        // Convert ObjC method implementations to Swift
        if (trimmed.starts_with('-') || trimmed.starts_with('+'))
            && trimmed.contains('(')
            && trimmed.ends_with('{')
        {
            let swift_line = convert_objc_method_line(trimmed);
            lines.push(swift_line);
            continue;
        }
        lines.push(line.to_string());
    }
    result = lines.join("\n");

    // --- 5. Method calls [receiver message] ---
    // [self doSomething] -> self.doSomething()
    // [obj doSomethingWith:param] -> obj.doSomethingWith(param:)
    // [obj method:arg1 second:arg2] -> obj.method(arg1, second: arg2)
    // This is the most complex regex; we handle standard patterns
    let re = Regex::new(r"\[(\w+)\s+(\w+)((?:\s+\w+(?::\s*[^\]]+)?)*)\]").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let receiver = &caps[1];
        let selector_start = &caps[2];
        let rest = caps.get(3).map(|m| m.as_str()).unwrap_or("");
        let rest = rest.trim();
        if rest.is_empty() {
            format!("{}.{}()", receiver, selector_start)
        } else if !rest.contains(':') {
            // [obj doSomething param]  -> this isn't standard ObjC, skip
            format!("{}.{}({})", receiver, selector_start, rest)
        } else {
            // Parse arguments
            // rest = " arg1:value1 arg2:value2"
            let mut args = Vec::new();
            let re_arg = Regex::new(r"(\w+)\s*:\s*([^\s]+(?:\s+[^\s]+)*?)(?=\s+\w+\s*:|\s*$)").unwrap();
            for cap in re_arg.captures_iter(rest) {
                let label = &cap[1];
                let val = cap[2].trim();
                // If the first argument, use unnamed parameter
                if args.is_empty() {
                    args.push(format!("{}: {}", label, val));
                } else {
                    args.push(format!("{}: {}", label, val));
                }
            }
            if args.is_empty() {
                format!("{}.{}()", receiver, selector_start)
            } else {
                format!("{}.{}({})", receiver, selector_start, args.join(", "))
            }
        }
    }).to_string();

    // [obj alloc] init... -> ClassName()
    // First, handle [[Obj alloc] init...]
    let re = Regex::new(r"\[\[(\w+)\s+alloc\]\s+(init\w*(?::[^\]]*)?)\]").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let cls = &caps[1];
        let init_selector = caps[2].trim();
        if init_selector == "init" {
            format!("{}()", cls)
        } else {
            // init with args: extract parameters
            let re_init = Regex::new(r"init\w*((?::[^:]+)*)").unwrap();
            if let Some(init_caps) = re_init.captures(&init_selector) {
                let args_str = init_caps.get(1).map(|m| m.as_str()).unwrap_or("");
                if args_str.is_empty() {
                    format!("{}()", cls)
                } else {
                    let mut args = Vec::new();
                    for _cap in re_init.captures_iter(args_str) {
                        // Each :(type)value
                        args.push("...".to_string());
                    }
                    format!("{}({})", cls, args.join(", "))
                }
            } else {
                format!("{}()", cls)
            }
        }
    }).to_string();

    // --- Foundation method calls (before literal conversion strips @) ---
    // NSLog(@"...", args) -> print("...", args)
    let re = Regex::new(r#"NSLog\(@"([^"]*)"\s*(?:,\s*(.+?))?\)"#).unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let fmt = &caps[1];
        let args = caps.get(2).map(|m| m.as_str()).unwrap_or("");
        if args.is_empty() {
            format!("print(\"{}\")", fmt)
        } else {
            format!("print(\"{}\", {})", fmt, args)
        }
    }).to_string();
    // NSLog with plain @""
    let re = Regex::new(r#"NSLog\(@"([^"]*)"\)"#).unwrap();
    result = re.replace_all(&result, "print(\"$1\")").to_string();
    // NSAssert(cond, desc) -> assert(cond, desc)
    let re = Regex::new(r"NSAssert\(([^,]+),\s*(.+)\)").unwrap();
    result = re.replace_all(&result, "assert($1, $2)").to_string();
    // @selector(method:) -> #selector(method:)
    let re = Regex::new(r"@selector\(([^)]+)\)").unwrap();
    result = re.replace_all(&result, "#selector($1)").to_string();

    // --- 6. Literal conversions ---
    // NSString *str = @"text" -> let str = "text"
    let re = Regex::new(r#"@\"([^"]*)\""#).unwrap();
    result = re.replace_all(&result, "\"$1\"").to_string();

    // @(expr) -> expr
    let re = Regex::new(r"@\(([^)]+)\)").unwrap();
    result = re.replace_all(&result, "$1").to_string();

    // @{key: value, ...} -> [key: value, ...]
    let re = Regex::new(r"@\{([^}]*)\}").unwrap();
    result = re.replace_all(&result, "[$1]").to_string();

    // @[a, b, c] -> [a, b, c]
    let re = Regex::new(r"@\[([^\]]*)\]").unwrap();
    result = re.replace_all(&result, "[$1]").to_string();

    // @YES/@NO -> true/false
    let re = Regex::new(r"@YES\b").unwrap();
    result = re.replace_all(&result, "true").to_string();
    let re = Regex::new(r"@NO\b").unwrap();
    result = re.replace_all(&result, "false").to_string();

    // @(int|float|double|NSInteger)number -> number
    let re = Regex::new(r"@(\d+\.?\d*(?:f|d)?)\b").unwrap();
    result = re.replace_all(&result, "$1").to_string();

    // YES/NO -> true/false
    let re = Regex::new(r"\bYES\b").unwrap();
    result = re.replace_all(&result, "true").to_string();
    let re = Regex::new(r"\bNO\b").unwrap();
    result = re.replace_all(&result, "false").to_string();

    // nil -> nil (stays same in Swift)

    // --- 7. Control flow ---
    // if (cond) -> if cond {  (also while, for, switch)
    let re = Regex::new(r"(?m)^\s*(if|while|for)\s*\(([^)]*)\)\s*$").unwrap();
    result = re.replace_all(&result, "$1 $2 {").to_string();
    // catch for single-line if: if (cond) stmt;
    let re = Regex::new(r"(?m)^\s*(if|while|for)\s*\(([^)]*)\)\s*([^{;]+);\s*$").unwrap();
    result = re.replace_all(&result, "$1 $2 {\n    $3;\n}").to_string();

    // for (int i = 0; i < n; i++) -> for i in stride(from: 0, to: n, by: 1)
    let re = Regex::new(
        r"for\s*\(\s*(?:int|NSInteger|long)\s+(\w+)\s*=\s*(\d+)\s*;\s*\w+\s*([<>=!]+)\s*(\w+)\s*;\s*\w+\s*(\+\+|--)\s*\)"
    ).unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let from = &caps[2];
        let op = &caps[3];
        let to = &caps[4];
        let inc = &caps[5];
        if inc == "++" && (op == "<" || op == "<=") {
            let exclusive = if op == "<=" { format!("({} + 1)", to) } else { to.to_string() };
            format!("for {} in {}..<{} {{", &caps[1], from, exclusive)
        } else if inc == "--" && (op == ">" || op == ">=") {
            let exclusive = if op == ">=" { format!("({} - 1)", to) } else { to.to_string() };
            format!("for {} in stride(from: {}, to: {}, by: -1) {{", &caps[1], from, exclusive)
        } else {
            format!("for {} in stride(from: {}, to: {}, by: 1) {{ // FIXME", &caps[1], from, to)
        }
    }).to_string();

    // for (Type var in collection) -> for var in collection
    let re = Regex::new(r"for\s*\([^)]+?\s+(\w+)\s+in\s+(\w+)\s*\)").unwrap();
    result = re.replace_all(&result, "for $1 in $2 {").to_string();

    // @try -> do
    let re = Regex::new(r"@try\s*\{").unwrap();
    result = re.replace_all(&result, "do {").to_string();
    let re = Regex::new(r"@catch\s*\(([^)]*)\)\s*\{").unwrap();
    result = re.replace_all(&result, "catch { // FIXME: was catch($1)").to_string();
    let re = Regex::new(r"@finally\s*\{").unwrap();
    result = re.replace_all(&result, "defer {").to_string();

    // --- 8. Type casts and boxed expressions ---
    // (Type)expr -> Type(expr)
    let re = Regex::new(r"\((\w+\s*\**)\)\s*(\w+)").unwrap();
    result = re.replace_all(&result, "$1($2)").to_string();
    // But be careful with casts like (NSString *)@"..."
    let re = Regex::new(r#"\(NSString\s*\*\)\s*"([^"]*)""#).unwrap();
    result = re.replace_all(&result, "\"$1\"").to_string();

    // --- 9. Foundation types ---
    // NSString -> String, NSArray -> [Any], NSDictionary -> [AnyHashable: Any], etc.
    let type_map: [(&str, &str); 20] = [
        (r"\bNSString\s*\*", "String"),
        (r"\bNSMutableString\s*\*", "String"), // mutability handled by var
        (r"\bNSInteger\b", "Int"),
        (r"\bNSUInteger\b", "UInt"),
        (r"\bCGFloat\b", "CGFloat"),
        (r"\bCGRect\b", "CGRect"),
        (r"\bCGPoint\b", "CGPoint"),
        (r"\bCGSize\b", "CGSize"),
        (r"\bBOOL\b", "Bool"),
        (r"\binstancetype\b", "Self"),
        (r"\bid\b", "Any"),
        (r"\bNSArray\s*\*", "[Any]"),
        (r"\bNSMutableArray\s*\*", "[Any]"),
        (r"\bNSDictionary\s*\*", "[AnyHashable: Any]"),
        (r"\bNSMutableDictionary\s*\*", "[AnyHashable: Any]"),
        (r"\bNSSet\s*\*", "Set<AnyHashable>"),
        (r"\bNSMutableSet\s*\*", "Set<AnyHashable>"),
        (r"\bNSNumber\s*\*", "NSNumber"),
        (r"\bNSDate\s*\*", "Date"),
        (r"\bNSData\s*\*", "Data"),
    ];
    for (pattern, swift_type) in &type_map {
        let re = Regex::new(pattern).unwrap();
        result = re.replace_all(&result, *swift_type).to_string();
    }

    // cast (NSString *) to String
    let re = Regex::new(r#"\(String\)\s*"([^"]*)""#).unwrap();
    result = re.replace_all(&result, "\"$1\"").to_string();

    // --- 10. Foundation method calls ---
    // [NSDictionary dictionary] -> [:]  etc. but we already handle alloc/init
    // [obj length] -> obj.count
    let re = Regex::new(r"\b(\w+)\.length\b").unwrap();
    result = re.replace_all(&result, "$1.count").to_string();

    // dispatch_async(dispatch_get_main_queue(), ^{ ... }) -> DispatchQueue.main.async { ... }
    let re = Regex::new(
        r"dispatch_async\(dispatch_get_main_queue\(\)\s*,\s*\^\s*\{"
    ).unwrap();
    result = re.replace_all(&result, "DispatchQueue.main.async {").to_string();

    // ^{ ... } block -> { ... } closure
    let re = Regex::new(r"\^\s*\(([^)]*)\)\s*\{").unwrap();
    result = re.replace_all(&result, "{ ($1) in").to_string();
    let re = Regex::new(r"\^\s*\{").unwrap();
    result = re.replace_all(&result, "{").to_string();

    // CGRectMake(x, y, w, h) -> CGRect(x: x, y: y, width: w, height: h)
    let re = Regex::new(r"CGRectMake\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)").unwrap();
    result = re.replace_all(&result, "CGRect(x: $1, y: $2, width: $3, height: $4)").to_string();
    let re = Regex::new(r"CGPointMake\(([^,]+),\s*([^)]+)\)").unwrap();
    result = re.replace_all(&result, "CGPoint(x: $1, y: $2)").to_string();
    let re = Regex::new(r"CGSizeMake\(([^,]+),\s*([^)]+)\)").unwrap();
    result = re.replace_all(&result, "CGSize(width: $1, height: $2)").to_string();

    // --- 11. typedef -> typealias ---
    let re = Regex::new(r"(?m)^\s*typedef\s+(.+?)\s+(\w+);\s*$").unwrap();
    result = re.replace_all(&result, "typealias $2 = $1").to_string();

    // --- 12. Protocol declarations ---
    // @protocol Name <Parent> -> protocol Name: Parent
    let re = Regex::new(r"(?m)^\s*@protocol\s+(\w+)(?:\s*<([^>]+)>)?\s*$").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let name = &caps[1];
        let parent = caps.get(2).map(|m| m.as_str()).unwrap_or("");
        if parent.is_empty() {
            format!("protocol {} {{", name)
        } else {
            format!("protocol {}: {} {{", name, parent)
        }
    }).to_string();

    // @optional -> optional (Swift equivalent inside protocol)
    let re = Regex::new(r"(?m)^\s*@optional\s*$").unwrap();
    result = re.replace_all(&result, "// @objc optional").to_string();
    let re = Regex::new(r"(?m)^\s*@required\s*$").unwrap();
    result = re.replace_all(&result, "").to_string();

    // --- 13. Enum declarations ---
    // typedef NS_ENUM(NSInteger, Name) { ... } -> enum Name: Int { ... }
    let re = Regex::new(r"typedef\s+NS_ENUM\(([^,]+),\s*(\w+)\)\s*\{").unwrap();
    result = re.replace_all(&result, "enum $2: $1 {").to_string();
    let re = Regex::new(r"typedef\s+NS_OPTIONS\(([^,]+),\s*(\w+)\)\s*\{").unwrap();
    result = re.replace_all(&result, "struct $2: OptionSet {\n    let rawValue: $1").to_string();

    // --- 14. Cleanup: blank lines at start of class body, triple blanks ---
    let re = Regex::new(r"\{\s*\n\s*\n").unwrap();
    result = re.replace_all(&result, "{\n").to_string();
    let re = Regex::new(r"\n\s*\n\s*\n").unwrap();
    result = re.replace_all(&result, "\n\n").to_string();

    // Append closing brace if a class/extension was opened but not closed
    if result.contains("class ") || result.contains("extension ") || result.contains("protocol ") {
        result.push_str("\n}");
    }

    result
}

/// Convert an ObjC type string to its Swift equivalent
fn objc_type_to_swift(typ: &str) -> String {
    match typ.trim() {
        // Remove leading/trailing whitespace and asterisks
        "void" | "IBAction" => "Void".to_string(),
        "BOOL" => "Bool".to_string(),
        "NSInteger" | "NSInteger *" => "Int".to_string(),
        "NSUInteger" | "NSUInteger *" => "UInt".to_string(),
        "int" | "int *" => "Int32".to_string(),
        "long" => "Int".to_string(),
        "float" | "float *" => "Float".to_string(),
        "double" | "double *" => "Double".to_string(),
        "CGFloat" => "CGFloat".to_string(),
        "NSString" | "NSString *" => "String".to_string(),
        "NSMutableString" | "NSMutableString *" => "String".to_string(),
        "NSArray" | "NSArray *" => "[Any]".to_string(),
        "NSMutableArray" | "NSMutableArray *" => "[Any]".to_string(),
        "NSDictionary" | "NSDictionary *" => "[AnyHashable: Any]".to_string(),
        "NSMutableDictionary" | "NSMutableDictionary *" => "[AnyHashable: Any]".to_string(),
        "NSSet" | "NSSet *" => "Set<AnyHashable>".to_string(),
        "id" => "Any".to_string(),
        "instancetype" => "Self".to_string(),
        "Class" => "AnyClass".to_string(),
        "SEL" => "Selector".to_string(),
        "NSNumber" | "NSNumber *" => "NSNumber".to_string(),
        "NSDate" | "NSDate *" => "Date".to_string(),
        "NSData" | "NSData *" => "Data".to_string(),
        "NSURL" | "NSURL *" => "URL".to_string(),
        "NSError" | "NSError *" => "Error".to_string(),
        "NSException" | "NSException *" => "NSException".to_string(),
        _ => {
            let t = typ.trim().trim_end_matches('*').trim();
            if t.is_empty() { "Any".to_string() } else { t.to_string() }
        }
    }
}

/// Convert a single ObjC method implementation line to Swift
/// Input example: "- (void)setName:(NSString *)newName age:(NSInteger)newAge {"
/// Output:        "func setName(_ newName: String, age newAge: Int) {"
fn convert_objc_method_line(line: &str) -> String {
    let line = line.trim();
    let is_class = line.starts_with('+');
    let kw = if is_class { "class func" } else { "func" };

    // Remove leading -/+ and whitespace
    let after_prefix = line.trim_start_matches('-').trim_start_matches('+').trim_start();

    // Extract return type: (returnType)
    let re_ret = Regex::new(r"^\(([^)]*)\)\s*").unwrap();
    let ret_type = re_ret.captures(after_prefix)
        .map(|c| c[1].trim().to_string())
        .unwrap_or_else(|| "void".to_string());

    // Remove return type from the line
    let without_ret = re_ret.replace(after_prefix, "").to_string();

    // Now we have: "methodName:(Type)param ... {"
    // Split into method name and params
    let without_brace = without_ret.trim_end_matches('{').trim_end().to_string();

    // Find all parameter segments: :(Type)paramName
    let re_param = Regex::new(r":\s*\(([^)]*)\)\s*(\w+)").unwrap();
    let param_captures: Vec<(String, String)> = re_param.captures_iter(&without_brace)
        .map(|c| (c[1].trim().to_string(), c[2].to_string()))
        .collect();

    // Method name is the first word before the first :
    let method_name = without_brace.split(':').next()
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|| "method".to_string());

    let ret_str = if ret_type == "void" || ret_type == "IBAction" {
        String::new()
    } else {
        format!(" -> {}", objc_type_to_swift(&ret_type))
    };

    if param_captures.is_empty() {
        format!("{} {}(){} {{", kw, method_name, ret_str)
    } else {
        let params: Vec<String> = param_captures.iter()
            .map(|(ptype, pname)| {
                let swift_type = objc_type_to_swift(ptype);
                format!("_ {}: {}", pname, swift_type)
            })
            .collect();
        format!("{} {}({}){} {{", kw, method_name, params.join(", "), ret_str)
    }
}

fn java_to_kotlin(source: &str) -> String {
    let mut result = source.to_string();

    // --- 1. Package statement ---
    let re = Regex::new(r"(?m)^\s*package\s+([^;]+);").unwrap();
    result = re.replace_all(&result, "package $1").to_string();

    // --- 2. Imports ---
    // import java.util.List -> keep (Kotlin uses same)
    // import com.example.Foo -> keep

    // --- 3. Class/interface/enum declarations ---
    // public class Foo extends Bar implements Baz -> class Foo : Bar, Baz
    let re = Regex::new(
        r"(?m)^(\s*)(?:public\s+)?(?:abstract\s+)?(?:final\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?\s*\{"
    ).unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let indent = &caps[1];
        let name = &caps[2];
        let ext = caps.get(3).map(|m| m.as_str()).unwrap_or("");
        let impls = caps.get(4).map(|m| m.as_str()).unwrap_or("");
        if !ext.is_empty() && !impls.is_empty() {
            format!("{}class {} : {}(), {} {{", indent, name, ext, impls)
        } else if !ext.is_empty() {
            format!("{}class {} : {}() {{", indent, name, ext)
        } else if !impls.is_empty() {
            format!("{}class {} : {} {{", indent, name, impls)
        } else {
            format!("{}class {} {{", indent, name)
        }
    }).to_string();

    // public interface Foo -> interface Foo {
    let re = Regex::new(r"(?m)^(\s*)(?:public\s+)?interface\s+(\w+)(?:\s+extends\s+([^{]+))?\s*\{").unwrap();
    result = re.replace_all(&result, "${1}interface ${2} {").to_string();

    // public @interface Foo -> annotation class Foo {
    let re = Regex::new(r"(?m)^(\s*)(?:public\s+)?@interface\s+(\w+)").unwrap();
    result = re.replace_all(&result, "${1}annotation class ${2} {").to_string();

    // public enum Foo { ... } -> enum class Foo { ... }
    let re = Regex::new(r"(?m)^(\s*)(?:public\s+)?enum\s+(\w+)(?:\s+implements\s+([^{]+))?\s*\{").unwrap();
    result = re.replace_all(&result, "${1}enum class ${2} {").to_string();

    // --- 4. Members: field declarations ---
    // public static final int X = 5; -> const val X: Int = 5
    // private String name; -> private var name: String? = null
    // protected int count; -> protected var count: Int = 0
    let re = Regex::new(
        r"(?m)^(\s*)((?:public|private|protected)\s+)?(?:static\s+)?(?:final\s+)?(\w+(?:\[\])?(?:<[^>]+>)?)\s+(\w+)(?:\s*=\s*([^;]+))?\s*;\s*$"
    ).unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let indent = &caps[1];
        let vis = caps.get(2).map(|m| m.as_str()).unwrap_or("");
        let typ = java_type_to_kotlin(caps[3].trim());
        let name = &caps[4];
        let init = caps.get(5).map(|m| m.as_str().trim()).unwrap_or("");

        // Skip if the matched "type" is actually a Java keyword (e.g., return false;)
        let raw_type = caps[3].trim();
        if matches!(raw_type, "return" | "if" | "while" | "for" | "switch" | "case" | "break" | "continue" | "throw" | "catch" | "finally" | "new" | "try") {
            return caps[0].to_string();
        }

        let is_final = caps[0].contains("final");
        let is_static = caps[0].contains("static");
        let kw = if (is_final && is_static && !init.is_empty()) || (caps[0].contains("static final")) {
            "const val"
        } else if is_final || name.starts_with("val") {
            "val"
        } else {
            "var"
        };

        // Convert new Type() -> Type()
        let init_val = init.replace("new ", "");

        let init_str: String = if init_val == "null" || init_val.is_empty() {
            if typ == "String" || typ.contains('?') {
                " = null".to_string()
            } else if typ == "Int" || typ == "Long" || typ == "Short" || typ == "Byte" {
                " = 0".to_string()
            } else if typ == "Float" {
                " = 0.0f".to_string()
            } else if typ == "Double" {
                " = 0.0".to_string()
            } else if typ == "Boolean" {
                " = false".to_string()
            } else if typ == "Char" {
                " = '\\u0000'".to_string()
            } else {
                String::new()
            }
        } else {
            let init_val = init_val.trim_end_matches(';');
            format!(" = {}", init_val)
        };

        let mut out = format!("{}{}{} {}: {}", indent, vis, kw, name, typ);
        out.push_str(&init_str);
        out
    }).to_string();

    // --- 4b. Constructor declarations ---
    // public ClassName(params) { -> constructor(params) {
    let re = Regex::new(
        r"(?m)^(\s*)((?:public|private|protected)\s+)?([A-Z]\w+)\s*\(([^)]*)\)\s*(?:\s*throws\s+[^{]+)?\s*\{"
    ).unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let indent = &caps[1];
        let params_raw = caps.get(4).map(|m| m.as_str().trim()).unwrap_or("");
        let params: Vec<String> = if params_raw.is_empty() {
            Vec::new()
        } else {
            params_raw.split(',').map(|p| {
                let p = p.trim();
                let parts: Vec<&str> = p.split_whitespace().collect();
                if parts.len() >= 2 {
                    let ptype = java_type_to_kotlin(parts[..parts.len()-1].join(" ").trim());
                    let pname = parts.last().unwrap_or(&"arg");
                    format!("{}: {}", pname, ptype)
                } else {
                    p.to_string()
                }
            }).collect()
        };
        format!("{}constructor({}) {{", indent, params.join(", "))
    }).to_string();

    // --- 5. Method declarations ---
    // public void method(Type param) { ... }
    // public static Type method(...) { ... }
    // private Type method(...) { ... }
    let re = Regex::new(
        r"(?m)^(\s*)((?:public|private|protected)\s+)?(?:static\s+)?(?:final\s+)?(\w+(?:\[\])?(?:<[^>]+>)?)\s+(\w+)\s*\(([^)]*)\)\s*(?:\s*throws\s+[^{]+)?\s*\{"
    ).unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let indent = &caps[1];
        let vis = caps.get(2).map(|m| m.as_str()).unwrap_or("");
        let ret_type = caps[3].trim();
        let name = &caps[4];
        let params_raw = caps[5].trim();
        let is_static = caps[0].contains("static");

        let ret_str = if ret_type == "void" { "Unit".to_string() } else { java_type_to_kotlin(ret_type) };

        let params: Vec<String> = if params_raw.is_empty() {
            Vec::new()
        } else {
            params_raw.split(',').map(|p| {
                let p = p.trim();
                let parts: Vec<&str> = p.split_whitespace().collect();
                if parts.len() >= 2 {
                    let ptype = java_type_to_kotlin(parts[..parts.len()-1].join(" ").trim());
                    let pname = parts.last().unwrap_or(&"arg");
                    // Remove trailing array brackets from name
                    let pname = pname.trim_end_matches("[]");
                    format!("{}: {}", pname, ptype)
                } else {
                    p.to_string()
                }
            }).collect()
        };

        if name == "main" && params.len() == 1 && params[0].contains("Array<String>") {
            // main method -> special handling for Kotlin
            format!("{}@JvmStatic\n{}fun main(args: Array<String>) {{", indent, indent)
        } else {
            if is_static {
                format!("{}@JvmStatic\n{}fun {}({}): {} {{", indent, indent, name, params.join(", "), ret_str)
            } else {
                format!("{}{}fun {}({}): {} {{", indent, vis, name, params.join(", "), ret_str)
            }
        }
    }).to_string();

    // Remove standalone constructor signatures (constructor name = class name)
    // They're handled by class declaration in Kotlin

    // --- 6. Annotations ---
    // @Override -> override (and strip redundant public)
    let re = Regex::new(r"@Override\s*").unwrap();
    result = re.replace_all(&result, "override ").to_string();
    let re = Regex::new(r"override\s+public\s+").unwrap();
    result = re.replace_all(&result, "override ").to_string();
    let re = Regex::new(r"@Deprecated").unwrap();
    result = re.replace_all(&result, "@Deprecated").to_string();
    let re = Regex::new(r"@SuppressWarnings\([^)]*\)").unwrap();
    result = re.replace_all(&result, "@Suppress").to_string();
    let re = Regex::new(r"@Nullable").unwrap();
    result = re.replace_all(&result, "").to_string();
    let re = Regex::new(r"@NotNull").unwrap();
    result = re.replace_all(&result, "").to_string();

    // --- 7. Control flow and expressions ---
    // System.out.println -> println, System.out.print -> print
    let re = Regex::new(r"System\.(out|err)\.(println|print|printf)").unwrap();
    result = re.replace_all(&result, "$2").to_string();

    // String.format(...) -> "...".format(...)
    let re = Regex::new(r"String\.format\(([^,]+),\s*(.+)\)").unwrap();
    result = re.replace_all(&result, "$1.format($2)").to_string();

    // new ArrayList<>() -> mutableListOf()
    let re = Regex::new(r"new\s+ArrayList\s*<[^>]*>\s*\(\)").unwrap();
    result = re.replace_all(&result, "mutableListOf()").to_string();
    let re = Regex::new(r"new\s+HashMap\s*<[^>]*>\s*\(\)").unwrap();
    result = re.replace_all(&result, "mutableMapOf()").to_string();
    let re = Regex::new(r"new\s+HashSet\s*<[^>]*>\s*\(\)").unwrap();
    result = re.replace_all(&result, "mutableSetOf()").to_string();
    let re = Regex::new(r"new\s+(\w+)\s*\(").unwrap();
    result = re.replace_all(&result, "$1(").to_string();

    // instanceof -> is
    let re = Regex::new(r"(\w+)\s+instanceof\s+(\w+)").unwrap();
    result = re.replace_all(&result, "$1 is $2").to_string();

    // (Type) cast -> as Type
    let re = Regex::new(r"\((\w+)\)\s*(\w+)").unwrap();
    result = re.replace_all(&result, "$2 as $1").to_string();

    // for (Type var : collection) -> for (var in collection)
    let re = Regex::new(r"for\s*\((\w+(?:\[\])?(?:<[^>]+>)?)\s+(\w+)\s*:\s*(\w+)\)").unwrap();
    result = re.replace_all(&result, "for ($2 in $3)").to_string();

    // switch(x) { case a: ... } -> when (x) { a -> ... }
    let re = Regex::new(r"switch\s*\(([^)]+)\)\s*\{").unwrap();
    result = re.replace_all(&result, "when ($1) {").to_string();
    let re = Regex::new(r"case\s+(.+?)\s*:").unwrap();
    result = re.replace_all(&result, "$1 ->").to_string();
    let re = Regex::new(r"break;").unwrap();
    result = re.replace_all(&result, "").to_string();
    let re = Regex::new(r"default:").unwrap();
    result = re.replace_all(&result, "else ->").to_string();

    // try-catch-finally
    let re = Regex::new(r"catch\s*\((\w+)\s+(\w+)\)").unwrap();
    result = re.replace_all(&result, "catch ($2: $1)").to_string();

    // synchronized -> @Synchronized (handled by annotation)

    // Ternary a ? b : c -> if (a) b else c
    // This is risky with regex; skip for now

    // --- 8. C-style for loop ---
    // for (int i = 0; i < n; i++) -> for (i in 0 until n)
    let re = Regex::new(
        r"for\s*\(\s*(?:\w+(?:\[\])?(?:<[^>]+>)?)\s+(\w+)\s*=\s*([^;]+)\s*;\s*\w+\s*([<>=!]+)\s*([^;]+)\s*;\s*\w+\s*(\+\+|--|\+=\s*\w+|--=\s*\w+)\s*\)"
    ).unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let var = &caps[1];
        let init = &caps[2];
        let limit = &caps[4];
        let init = init.trim();
        let limit = limit.trim();
        if init == "0" {
            format!("for ({} in 0 until {})", var, limit)
        } else {
            format!("for ({} in {} until {})", var, init, limit)
        }
    }).to_string();

    // --- 9. Null safety ---
    // String name = null; -> var name: String? = null
    // (Handled by field regex above)

    // --- 9. Logging and common patterns ---
    // System.out.println -> println (already done)

    // --- 10. Type mappings (broad) ---
    let type_mappings: [(&str, &str); 10] = [
        (r"\bvoid\b", "Unit"),
        (r"\bBoolean\b", "Boolean"),
        (r"\bInteger\b", "Int"),
        (r"\bArrayList\b", "ArrayList"),
        (r"\bHashMap\b", "HashMap"),
        (r"\bHashSet\b", "HashSet"),
        (r"\bList\b", "List"),
        (r"\bMap\b", "Map"),
        (r"\bSet\b", "Set"),
        (r"\bObject\b", "Any"),
    ];
    for (pattern, kt_type) in &type_mappings {
        let re = Regex::new(pattern).unwrap();
        result = re.replace_all(&result, *kt_type).to_string();
    }

    // --- 11. Cleanup ---
    // Remove trailing semicolons
    let re = Regex::new(r";(\s*[)}])").unwrap();
    result = re.replace_all(&result, "$1").to_string();
    // Remove remaining single ; on lines
    let re = Regex::new(r";\s*$").unwrap();
    result = re.replace_all(&result, "").to_string();
    let re = Regex::new(r";\s*\n").unwrap();
    result = re.replace_all(&result, "\n").to_string();
    // Remove empty throws clauses
    let re = Regex::new(r"\s*throws\s+\w+(?:\s*,\s*\w+)*").unwrap();
    result = re.replace_all(&result, "").to_string();
    // Remove blank lines after opening braces
    let re = Regex::new(r"\{\s*\n\s*\n").unwrap();
    result = re.replace_all(&result, "{\n").to_string();
    // Collapse multiple blank lines
    let re = Regex::new(r"\n\s*\n\s*\n").unwrap();
    result = re.replace_all(&result, "\n\n").to_string();

    result
}

/// Map Java types to Kotlin types
fn java_type_to_kotlin(typ: &str) -> String {
    let t = typ.trim();
    match t {
        "void" => "Unit".to_string(),
        "boolean" | "Boolean" => "Boolean".to_string(),
        "byte" | "Byte" => "Byte".to_string(),
        "short" | "Short" => "Short".to_string(),
        "int" | "Integer" => "Int".to_string(),
        "long" | "Long" => "Long".to_string(),
        "float" | "Float" => "Float".to_string(),
        "double" | "Double" => "Double".to_string(),
        "char" | "Character" => "Char".to_string(),
        "String" => "String".to_string(),
        "int[]" => "IntArray".to_string(),
        "byte[]" => "ByteArray".to_string(),
        "char[]" => "CharArray".to_string(),
        "String[]" => "Array<String>".to_string(),
        "Object" => "Any".to_string(),
        "Void" => "Unit".to_string(),
        "boolean[]" => "BooleanArray".to_string(),
        "long[]" => "LongArray".to_string(),
        "double[]" => "DoubleArray".to_string(),
        "float[]" => "FloatArray".to_string(),
        s if s.starts_with("List<") || s.starts_with("ArrayList<") => format!("MutableList<{}>", &t[5..t.len()-1]),
        s if s.starts_with("Map<") || s.starts_with("HashMap<") => format!("MutableMap<{}>", &t[4..t.len()-1]),
        s if s.starts_with("Set<") || s.starts_with("HashSet<") => format!("MutableSet<{}>", &t[4..t.len()-1]),
        _ => {
            let t = t.trim_end_matches("[]");
            if t.is_empty() { "Any".to_string() } else { t.to_string() }
        }
    }
}

fn vb_to_csharp(source: &str) -> String {
    let mut result = source.to_string();

    // --- 1. Comments ---
    // VB6 single quotes -> //  (but beware of strings)
    let re = Regex::new(r"(?m)^\s*'").unwrap();
    result = re.replace_all(&result, "//").to_string();
    let re = Regex::new(r"Rem\s+").unwrap();
    result = re.replace_all(&result, "// ").to_string();

    // --- 2. Module attributes (remove) ---
    let re = Regex::new(r"(?m)^Attribute\s+\w+\s*=\s*.*$").unwrap();
    result = re.replace_all(&result, "").to_string();
    let re = Regex::new(r"(?m)^VERSION\s+.*$").unwrap();
    result = re.replace_all(&result, "").to_string();
    let re = Regex::new(r"(?m)^Begin\s+\{[^}]+\}\s+\w+.*$").unwrap();
    result = re.replace_all(&result, "").to_string();
    let re = Regex::new(r"(?m)^Begin\s+\w+.*$").unwrap();
    result = re.replace_all(&result, "").to_string();
    let re = Regex::new(r"(?m)^End\s*$").unwrap();
    result = re.replace_all(&result, "").to_string();

    // --- 3. Module/Class declarations ---
    // Attribute VB_Name = "Module1" already removed above
    // No equivalent in C# — wrap in static class

    // --- 4. Variable declarations ---
    // Dim x As Type -> Type x;
    // Private x As Type -> private Type x;
    // Public x As Type -> public Type x;
    // Static x As Type -> static Type x;
    // WithEvents x As Type -> private Type x;
    let re = Regex::new(
        r"(?m)^(\s*)(?:Dim|Private|Public|Static|WithEvents)\s+(?:ByVal\s+|ByRef\s+|Optional\s+)?(\w+)\s+As\s+(New\s+)?(\w+(?:\([^)]*\))?(?:\s*\*)?(?:\s*\d+)?)(?:\s*=\s*(.+))?"
    ).unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let indent = &caps[1];
        let name = &caps[2];
        let is_new = caps.get(3).map(|m| m.as_str()).unwrap_or("");
        let raw_type = caps.get(4).map(|m| m.as_str()).unwrap_or("Object");
        let init = caps.get(5).map(|m| m.as_str().trim()).unwrap_or("");

        let cstype = vb_type_to_csharp(raw_type);

        if !is_new.is_empty() && init.is_empty() {
            format!("{}{} {} = new {}();", indent, cstype, name, cstype)
        } else if !init.is_empty() {
            format!("{}{} {} = {};", indent, cstype, name, init)
        } else {
            format!("{}{} {};", indent, cstype, name)
        }
    }).to_string();

    // Remove the backreference-based regex — handled by normal Dim logic above

    // --- 5. Const declarations ---
    let re = Regex::new(r"(?m)^(\s*)(?:Public|Private)?\s*Const\s+(\w+)\s+As\s+(\w+)\s*=\s*(.+)$").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let indent = &caps[1];
        let name = &caps[2];
        let typ = vb_type_to_csharp(&caps[3]);
        let val = &caps[4];
        format!("{}const {} {} = {};", indent, typ, name, val)
    }).to_string();

    // --- 6. Procedure declarations ---
    // Private Sub Name(params) -> private void Name(params)
    // Public Function Name(params) As Type -> public Type Name(params)
    // Friend Sub/Function -> internal ...
    let re = Regex::new(
        r"(?m)^(\s*)((?:Public|Private|Friend)\s+)?(?:Static\s+)?(Sub|Function|Property\s+(?:Get|Let|Set))(?:\s+(\w+))?\s*\(([^)]*)\)\s*(?:As\s+(\w+))?"
    ).unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let indent = &caps[1];
        let vis = caps.get(2).map(|m| m.as_str().trim()).unwrap_or("private");
        let kind = &caps[3];
        let name = &caps[4];
        let params_raw = caps.get(5).map(|m| m.as_str().trim()).unwrap_or("");
        let ret_type = caps.get(6).map(|m| vb_type_to_csharp(m.as_str()));

        let csharp_vis = match vis {
            "Friend" => "internal",
            "Public" => "public",
            "Private" => "private",
            _ => vis,
        };

        let params: Vec<String> = if params_raw.is_empty() {
            Vec::new()
        } else {
            params_raw.split(',').map(|p| {
                let p = p.trim();
                if p.is_empty() { return String::new(); }
                // Parse "ByVal name As Type" or "Optional ByVal name As Type = default"
                let re_p = Regex::new(r"(?:Optional\s+)?(?:ByVal|ByRef)?\s*(\w+)\s+As\s+(\w+)").unwrap();
                if let Some(cap) = re_p.captures(p) {
                    let pname = &cap[1];
                    let ptype = vb_type_to_csharp(&cap[2]);
                    format!("{} {}", ptype, pname)
                } else {
                    p.to_string()
                }
            }).collect()
        };

        match kind {
            "Sub" => {
                format!("{}{} void {}({}) {{", indent, csharp_vis, name, params.join(", "))
            }
            "Function" => {
                let ret = ret_type.as_deref().unwrap_or("void");
                format!("{}{} {} {}({}) {{", indent, csharp_vis, ret, name, params.join(", "))
            }
            "Property Get" => {
                let ret = ret_type.as_deref().unwrap_or("object");
                format!("{}{} {} {} {{ get {{", indent, csharp_vis, ret, name)
            }
            "Property Let" | "Property Set" => {
                if params.is_empty() {
                    format!("{}set {{", indent)
                } else {
                    format!("{}set {{", indent)
                }
            }
            _ => caps[0].to_string(),
        }
    }).to_string();

    // --- 7. End markers -> closing braces ---
    let re = Regex::new(r"(?m)^(\s*)End\s+(Sub|Function|Property|If|Select|With|Type|Class|Enum)\s*$").unwrap();
    result = re.replace_all(&result, "$1}").to_string();

    // --- 8. If/Then/Else/End If ---
    // Single-line: If cond Then action (same line only)
    let re = Regex::new(r"If[^\S\n]+([^\n]+?)[^\S\n]+Then[^\S\n]+([^\n]+)").unwrap();
    result = re.replace_all(&result, "if ($1) { $2; }").to_string();

    // Multi-line: If cond Then
    let re = Regex::new(r"(?m)^(\s*)If\s+(.+?)\s+Then\s*$").unwrap();
    result = re.replace_all(&result, "${1}if (${2}) {").to_string();

    // ElseIf -> else if
    let re = Regex::new(r"(?m)^(\s*)ElseIf\s+(.+?)\s+Then\s*$").unwrap();
    result = re.replace_all(&result, "$1} else if ($2) {").to_string();

    // Else -> } else {
    let re = Regex::new(r"(?m)^(\s*)Else\s*$").unwrap();
    result = re.replace_all(&result, "$1} else {").to_string();

    // --- 9. For loops ---
    // For i = start To end -> for (int i = start; i <= end; i++)
    let re = Regex::new(r"For[^\S\n]+(\w+)[^\S\n]*=[^\S\n]*([^\s]+)[^\S\n]+To[^\S\n]+([^\s]+)(?:[^\S\n]+Step[^\S\n]+(-?\d+))?").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let var = &caps[1];
        let start = &caps[2];
        let end = &caps[3];
        let step = caps.get(4).map(|m| m.as_str()).unwrap_or("1");
        if step == "-1" || step.starts_with('-') {
            format!("for (int {} = {}; {} >= {}; {}--)", var, start, var, end, var)
        } else if step != "1" {
            format!("for (int {} = {}; {} <= {}; {} += {})", var, start, var, end, var, step)
        } else {
            format!("for (int {} = {}; {} <= {}; {}++)", var, start, var, end, var)
        }
    }).to_string();

    // Next -> }
    let re = Regex::new(r"(?m)^(\s*)Next(?:\s+\w+)?\s*$").unwrap();
    result = re.replace_all(&result, "$1}").to_string();

    // --- 10. For Each -> foreach ---
    let re = Regex::new(r"For[^\S\n]+Each[^\S\n]+(\w+)[^\S\n]+In[^\S\n]+([^\n]+)").unwrap();
    result = re.replace_all(&result, "foreach (var $1 in $2)").to_string();

    // --- 11. Do While/Until -> while ---
    let re = Regex::new(r"Do[^\S\n]+While[^\S\n]+([^\n]+)").unwrap();
    result = re.replace_all(&result, "while ($1) {").to_string();
    let re = Regex::new(r"Do[^\S\n]+Until[^\S\n]+([^\n]+)").unwrap();
    result = re.replace_all(&result, "while (!($1)) {").to_string();
    let re = Regex::new(r"(?m)^\s*Do\s*$").unwrap();
    result = re.replace_all(&result, "do {").to_string();
    let re = Regex::new(r"(?m)^(\s*)Loop\s*(?:While|Until)?\s*(.*)?$").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let indent = &caps[1];
        let cond = caps.get(2).map(|m| m.as_str().trim()).unwrap_or("");
        if cond.is_empty() {
            format!("{}}} while (true);", indent)
        } else {
            format!("{}}} while ({});", indent, cond)
        }
    }).to_string();

    // Wend -> }
    let re = Regex::new(r"(?m)^(\s*)Wend\s*$").unwrap();
    result = re.replace_all(&result, "$1}").to_string();

    // --- 12. Select Case -> switch ---
    let re = Regex::new(r"Select[^\S\n]+Case[^\S\n]+([^\n]+)").unwrap();
    result = re.replace_all(&result, "switch ($1) {").to_string();
    let re = Regex::new(r"(?m)^(\s*)Case\s+(.+?)(?::|$)\s*$").unwrap();
    result = re.replace_all(&result, "${1}case ${2}:").to_string();
    let re = Regex::new(r"(?m)^(\s*)Case\s+Else\s*$").unwrap();
    result = re.replace_all(&result, "${1}default:").to_string();
    let re = Regex::new(r"(?m)^(\s*)End\s+Select\s*$").unwrap();
    result = re.replace_all(&result, "$1}").to_string();

    // --- 13. With/End With ---
    let re = Regex::new(r"With[^\S\n]+([^\n]+)").unwrap();
    result = re.replace_all(&result, "with ($1) {").to_string();

    // --- 14. Operators ---
    // <> -> !=
    let re = Regex::new(r"<>").unwrap();
    result = re.replace_all(&result, "!=").to_string();
    // = in expressions -> == (assignment handled elsewhere)
    // This is ambiguous in VB6 — skip and let AI cascade handle it

    // And -> && (but preserve identifiers containing "and")
    let re = Regex::new(r"\bAnd\b").unwrap();
    result = re.replace_all(&result, "&&").to_string();
    let re = Regex::new(r"\bOr\b").unwrap();
    result = re.replace_all(&result, "||").to_string();
    let re = Regex::new(r"\bNot\b").unwrap();
    result = re.replace_all(&result, "!").to_string();
    let re = Regex::new(r"\bXor\b").unwrap();
    result = re.replace_all(&result, "^").to_string();
    let re = Regex::new(r"\bMod\b").unwrap();
    result = re.replace_all(&result, "%").to_string();

    // String concatenation & -> +
    // careful: & is also bitwise And in VB
    // In VB, & is always string concat when used with strings
    // Let's be safe and only replace when between expressions
    let re = Regex::new(r"\s*&\s*").unwrap();
    result = re.replace_all(&result, " + ").to_string();

    // --- 15. VB6 built-in functions ---
    // MsgBox with parens
    let re = Regex::new(r"MsgBox\s*\(([^\n]+)\)").unwrap();
    result = re.replace_all(&result, "MessageBox.Show($1);").to_string();
    // Handle bare MsgBox without parens (e.g., "MsgBox msg")
    let re = Regex::new(r"(?m)^(\s*)MsgBox\s+([^\n]+)\s*$").unwrap();
    result = re.replace_all(&result, "${1}MessageBox.Show(${2});").to_string();

    // InputBox -> Interaction.InputBox
    let re = Regex::new(r"InputBox\s*\((.+?)\)").unwrap();
    result = re.replace_all(&result, "Interaction.InputBox($1)").to_string();

    // Type conversions
    let convs: [(&str, &str); 12] = [
        (r"CInt\s*\((.+?)\)", "Convert.ToInt32($1)"),
        (r"CLng\s*\((.+?)\)", "Convert.ToInt64($1)"),
        (r"CSng\s*\((.+?)\)", "Convert.ToSingle($1)"),
        (r"CDbl\s*\((.+?)\)", "Convert.ToDouble($1)"),
        (r"CStr\s*\((.+?)\)", "Convert.ToString($1)"),
        (r"CBool\s*\((.+?)\)", "Convert.ToBoolean($1)"),
        (r"CDate\s*\((.+?)\)", "Convert.ToDateTime($1)"),
        (r"CByte\s*\((.+?)\)", "Convert.ToByte($1)"),
        (r"CCur\s*\((.+?)\)", "Convert.ToDecimal($1)"),
        (r"CStr\s*\((.+?)\)", "Convert.ToString($1)"),
        (r"Val\s*\((.+?)\)", "Convert.ToDouble($1)"),
        (r"CVar\s*\((.+?)\)", "$1"),
    ];
    for (pat, repl) in &convs {
        let re = Regex::new(pat).unwrap();
        result = re.replace_all(&result, *repl).to_string();
    }

    // String functions
    let str_funcs: [(&str, &str); 15] = [
        (r"Len\s*\((.+?)\)", "$1.Length"),
        (r"Trim\s*\((.+?)\)", "$1.Trim()"),
        (r"LTrim\s*\((.+?)\)", "$1.TrimStart()"),
        (r"RTrim\s*\((.+?)\)", "$1.TrimEnd()"),
        (r"UCase\s*\((.+?)\)", "$1.ToUpper()"),
        (r"LCase\s*\((.+?)\)", "$1.ToLower()"),
        (r"Space\s*\((.+?)\)", "new string(' ', $1)"),
        (r"Asc\s*\((.+?)\)", "(int)$1[0]"),
        (r"Chr\s*\((.+?)\)", "(char)$1"),
        (r"AscW\s*\((.+?)\)", "(int)$1[0]"),
        (r"ChrW\s*\((.+?)\)", "(char)$1"),
        (r"Abs\s*\((.+?)\)", "Math.Abs($1)"),
        (r"Sqr\s*\((.+?)\)", "Math.Sqrt($1)"),
        (r"Sgn\s*\((.+?)\)", "Math.Sign($1)"),
        (r"Int\s*\((.+?)\)", "Math.Truncate($1)"),
    ];
    for (pat, repl) in &str_funcs {
        let re = Regex::new(pat).unwrap();
        result = re.replace_all(&result, *repl).to_string();
    }

    // Left, Right, Mid -> Substring
    let re = Regex::new(r"Left\s*\((.+?),\s*(.+?)\)").unwrap();
    result = re.replace_all(&result, "$1.Substring(0, $2)").to_string();
    // Right is harder without lookahead
    let re = Regex::new(r"Right\s*\((.+?),\s*(.+?)\)").unwrap();
    result = re.replace_all(&result, "$1.Substring($1.Length - $2)").to_string();
    let re = Regex::new(r"Mid\s*\((.+?),\s*(.+?),\s*(.+?)\)").unwrap();
    result = re.replace_all(&result, "$1.Substring(($2) - 1, $3)").to_string();
    let re = Regex::new(r"Mid\s*\((.+?),\s*(.+?)\)").unwrap();
    result = re.replace_all(&result, "$1.Substring(($2) - 1)").to_string();

    // Replace, Split, Join
    let re = Regex::new(r"Replace\s*\((.+?),\s*(.+?),\s*(.+?)\)").unwrap();
    result = re.replace_all(&result, "$1.Replace($2, $3)").to_string();
    let re = Regex::new(r"Split\s*\((.+?),\s*(.+?)\)").unwrap();
    result = re.replace_all(&result, "$1.Split($2)").to_string();
    let re = Regex::new(r"Join\s*\((.+?),\s*(.+?)\)").unwrap();
    result = re.replace_all(&result, "string.Join($2, $1)").to_string();

    // InStr
    let re = Regex::new(r"InStr\s*\((\d+),\s*(.+?),\s*(.+?)\)").unwrap();
    result = re.replace_all(&result, "$2.IndexOf($3, $1 - 1)").to_string();
    let re = Regex::new(r"InStr\s*\((.+?),\s*(.+?)\)").unwrap();
    result = re.replace_all(&result, "$1.IndexOf($2)").to_string();

    // IIf -> ternary
    let re = Regex::new(r"IIf\s*\((.+?),\s*(.+?),\s*(.+?)\)").unwrap();
    result = re.replace_all(&result, "$1 ? $2 : $3").to_string();

    // --- 16. Set statements ---
    let re = Regex::new(r"Set\s+(\w+)\s*=\s*(Nothing|New\s+\w+(?:\([^)]*\))?)").unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let var = &caps[1];
        let val = &caps[2];
        if val == "Nothing" {
            format!("{} = null;", var)
        } else {
            format!("{} = {};", var, val)
        }
    }).to_string();

    // --- 17. Error handling ---
    // On Error GoTo label -> try {
    let re = Regex::new(r"(?m)^\s*On\s+Error\s+GoTo\s+\w+\s*$").unwrap();
    result = re.replace_all(&result, "try {").to_string();
    let re = Regex::new(r"(?m)^\s*On\s+Error\s+Resume\s+Next\s*$").unwrap();
    result = re.replace_all(&result, "// On Error Resume Next").to_string();
    let re = Regex::new(r"(?m)^\s*Resume\s+Next\s*$").unwrap();
    result = re.replace_all(&result, "// continue;").to_string();
    let re = Regex::new(r"(?m)^\s*Resume\s*$").unwrap();
    result = re.replace_all(&result, "// continue;").to_string();

    // Err object
    let re = Regex::new(r"Err\.Number").unwrap();
    result = re.replace_all(&result, "// Err.Number").to_string();
    let re = Regex::new(r"Err\.Description").unwrap();
    result = re.replace_all(&result, "// Err.Description").to_string();
    let re = Regex::new(r"Err\.Clear").unwrap();
    result = re.replace_all(&result, "// Err.Clear").to_string();

    // --- 18. Type ... End Type -> struct ---
    let re = Regex::new(r"(?m)^(\s*)Type\s+(\w+)\s*$").unwrap();
    result = re.replace_all(&result, "${1}struct ${2} {").to_string();

    // --- 19. Enum ---
    let re = Regex::new(r"(?m)^(\s*)(?:Public\s+|Private\s+)?Enum\s+(\w+)\s*$").unwrap();
    result = re.replace_all(&result, "${1}enum ${2} {").to_string();

    // --- 20. Event handlers (VB6 forms) ---
    // Form_Load, Command1_Click, etc.
    let re = Regex::new(r"(\w+)_(Load|Click|DblClick|KeyDown|KeyPress|KeyUp|MouseDown|MouseUp|MouseMove|Change|GotFocus|LostFocus|Resize|Terminate|Initialize)\s*\(").unwrap();
    result = re.replace_all(&result, "$1_$2(object sender, EventArgs e)").to_string();

    // --- 21. Property Get/Let/Set -> C# auto-properties ---
    // VB Property Get already partially handled above
    // Let's also handle:
    // Public Property Name As Type -> public Type Name { get; set; }
    let re = Regex::new(r"(?m)^(\s*)(?:Public\s+|Private\s+)?Property\s+(\w+)\s+As\s+(\w+)\s*$").unwrap();
    result = re.replace_all(&result, "$1$3 $2 { get; set; }").to_string();

    // --- 22. Default values for optional parameters ---
    let re = Regex::new(r"Optional\s+(\w+)\s+As\s+(\w+)\s*=\s*(.+)").unwrap();
    result = re.replace_all(&result, "$2 $1 = $3").to_string();

    // --- 23. Remaining keywords and cleanup ---
    // Call keyword
    let re = Regex::new(r"Call\s+").unwrap();
    result = re.replace_all(&result, "").to_string();

    // Then on single line
    let re = Regex::new(r"\s+Then\s*$").unwrap();
    result = re.replace_all(&result, " {").to_string();

    // Let keyword
    let re = Regex::new(r"Let\s+").unwrap();
    result = re.replace_all(&result, "").to_string();

    // Is operator -> ==
    let re = Regex::new(r"\bIs\s+Not\b").unwrap();
    result = re.replace_all(&result, "!=").to_string();
    let re = Regex::new(r"\bIs\b").unwrap();
    result = re.replace_all(&result, "==").to_string();

    // Like operator -> string.Contains or regex
    let re = Regex::new(r#"(\w+)\s+Like\s+"([^"]*)""#).unwrap();
    result = re.replace_all(&result, "$1.Contains(\"$2\")").to_string();

    // Preserve with double quotes (lookahead not supported in Rust regex)
    let _re = Regex::new(r">\s*\+[^\d]").unwrap();

    // --- 24. DoEvents -> Application.DoEvents ---
    let re = Regex::new(r"DoEvents").unwrap();
    result = re.replace_all(&result, "System.Windows.Forms.Application.DoEvents()").to_string();

    // --- 25. Nothing -> null ---
    let re = Regex::new(r"\bNothing\b").unwrap();
    result = re.replace_all(&result, "null").to_string();

    // --- 26. True/False -> true/false ---
    let re = Regex::new(r"\bTrue\b").unwrap();
    result = re.replace_all(&result, "true").to_string();
    let re = Regex::new(r"\bFalse\b").unwrap();
    result = re.replace_all(&result, "false").to_string();

    // --- 27. AddressOf -> delegate ---
    let re = Regex::new(r"AddressOf\s+(\w+)").unwrap();
    result = re.replace_all(&result, "new EventHandler($1)").to_string();

    // --- 28. Semicolons ---
    // Add semicolons to statement lines that don't have them
    let re = Regex::new(r"(?m)^(\s*)((?:return\s+)?[\w.\[\]()]+(?:\s*=\s*[^;{]+|(?:\s*\([^)]*\))?))\s*$").unwrap();
    result = re.replace_all(&result, "$1$2;").to_string();

    result
}

fn vb_type_to_csharp(typ: &str) -> String {
    let t = typ.trim();
    match t {
        "Integer" => "int".to_string(),
        "Long" => "long".to_string(),
        "Single" => "float".to_string(),
        "Double" => "double".to_string(),
        "String" => "string".to_string(),
        "String *" => "string".to_string(),
        "Boolean" => "bool".to_string(),
        "Byte" => "byte".to_string(),
        "Date" => "DateTime".to_string(),
        "Currency" => "decimal".to_string(),
        "Variant" => "object".to_string(),
        "Object" => "object".to_string(),
        "Integer[]" => "int[]".to_string(),
        "Long[]" => "long[]".to_string(),
        "String[]" => "string[]".to_string(),
        s if s.ends_with('*') => s.trim_end_matches('*').trim().to_string(),
        s if s.chars().any(|c| c.is_ascii_digit()) => {
            // Strip fixed-length string indicators "String * 50" -> "string"
            let no_digits = s.trim_end_matches(|c: char| c.is_ascii_digit()).trim();
            vb_type_to_csharp(no_digits)
        }
        _ => {
            // Preserve the type name as-is (for user-defined types)
            t.to_string()
        }
    }
}

fn html_to_tsx(source: &str) -> String {
    let mut result = source.to_string();

    // class -> className (skip if contains `{` — already JSX)
    let re = Regex::new(r##"\bclass\s*="([^"]*)"##).unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let val = &caps[1];
        if val.contains('{') {
            caps[0].to_string()
        } else {
            format!("className=\"{}\"", val)
        }
    }).to_string();

    // for -> htmlFor (skip if contains `{` — already JSX)
    let re = Regex::new(r##"\bfor\s*="([^"]*)"##).unwrap();
    result = re.replace_all(&result, |caps: &regex::Captures| {
        let val = &caps[1];
        if val.contains('{') {
            caps[0].to_string()
        } else {
            format!("htmlFor=\"{}\"", val)
        }
    }).to_string();

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
