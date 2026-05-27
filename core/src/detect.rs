use once_cell::sync::Lazy;
use std::sync::Mutex;

static DETECTOR: Lazy<Mutex<crate::parser::LanguageDetector>> = Lazy::new(|| {
    Mutex::new(crate::parser::LanguageDetector::new())
});

pub fn detect_language(source: &str) -> String {
    // Try tree-sitter first
    if let Ok(mut detector) = DETECTOR.lock() {
        let result = detector.detect(source);
        if result != "Unknown" {
            return result;
        }
    }

    // Fallback: regex heuristics
    let source = source.trim();

    if source.starts_with("<?php") {
        return "PHP".to_string();
    }
    if source.starts_with("#!/usr/bin/env python") || source.starts_with("#!/usr/bin/python") {
        return "Python".to_string();
    }
    if source.starts_with("#!/usr/bin/env node") || source.starts_with("#!/usr/bin/node") {
        return "JavaScript".to_string();
    }
    if source.starts_with("#!/usr/bin/env bash") || source.starts_with("#!/bin/bash") {
        return "Bash".to_string();
    }
    if source.contains("fn main()") && source.contains("let mut ") {
        return "Rust".to_string();
    }
    if (source.contains(": string") || source.contains(": number") || source.contains(": boolean")
        || source.contains("interface ") || source.contains("type "))
        && !source.contains("<?php")
    {
        return "TypeScript".to_string();
    }
    if source.contains("const ") || source.contains("let ") || source.contains("=>")
        || source.contains("function ") || source.contains("require(")
    {
        return "JavaScript".to_string();
    }
    if source.contains("def ") || source.contains("if __name__") {
        return "Python".to_string();
    }
    if source.contains("package ") || source.contains("func ") {
        return "Go".to_string();
    }
    if source.contains("public class ") || source.contains("System.out") {
        return "Java".to_string();
    }
    if source.contains("using System") || source.contains("namespace ") {
        return "C#".to_string();
    }
    if source.contains("IDENTIFICATION DIVISION") || source.contains("PROGRAM-ID") {
        return "COBOL".to_string();
    }
    if source.contains("#include <") || source.contains("std::") {
        return "C++".to_string();
    }
    if source.contains("fun ") || (source.contains("val ") && source.contains("var ")) {
        return "Kotlin".to_string();
    }
    if source.contains("def ") && source.contains("end") && !source.contains(":") {
        return "Ruby".to_string();
    }

    "Unknown".to_string()
}
