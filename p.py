#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Один файл со снимком проекта:
- project_snapshot.txt (рядом со скриптом)
  1) ДЕРЕВО ФАЙЛОВ (без библиотек/сборки)
  2) КОД ФАЙЛОВ (без библиотек/бинарников)
Жёстко исключаем node_modules, .next, и lock-файлы (package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lockb).
"""

from __future__ import annotations
import os
from pathlib import Path
from typing import Iterable

SNAPSHOT_NAME = "project_snapshot.txt"

# --- каталоги, которые считаем "библиотечными/служебными" и исключаем ---
IGNORE_DIR_NAMES = {
    "node_modules", ".next", ".git", ".turbo", ".vercel",
    ".vscode", ".idea", ".cache", ".pnpm-store", "__pycache__",
    "coverage", "dist", "build", "out",
    ".bmad", ".agent"
}

# --- файлы, которые исключаем целиком (lock, временные, секретные) ---
EXCLUDE_FILENAMES = {
    # lock-файлы менеджеров пакетов
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb",
    # env по умолчанию не тянем в снапшот
    ".env", ".env.local", ".env.production", ".env.development",
    "p.py"
}
# шаблоны и типы, которые игнорируем
IGNORE_GLOBS = {"*.log", "*.tmp", "*.swp", "*.pyc", "*.pyo"}
# бинарники и тяжёлые форматы
BINARY_EXTS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg", ".ico",
    ".ttf", ".otf", ".woff", ".woff2", ".eot",
    ".pdf", ".zip", ".gz", ".tgz", ".rar", ".7z",
    ".mp3", ".wav", ".mp4", ".mov", ".avi", ".mkv", ".heic",
}
MAX_FILE_SIZE = 1_000_000  # 1 MB

# файлы «кода», которые включаем в снимок
CODE_EXTS = {
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".css", ".scss", ".sass", ".less",
    ".json", ".jsonc", ".md", ".mdx",
    ".html", ".yml", ".yaml",
    ".gitignore", ".eslintignore", ".prettierignore",
    ".eslintrc", ".prettierrc", ".npmrc",
}
SPECIAL_FILENAMES = {".gitignore", ".eslintignore", ".prettierignore", "package.json", "tsconfig.json"}

# --- helpers ---
def path_contains_blocked_segment(p: Path) -> bool:
    # если любой сегмент пути — из IGNORE_DIR_NAMES ⇒ игнорируем
    blocked = set(IGNORE_DIR_NAMES)
    return any(seg in blocked for seg in p.parts)

def is_ignored_dir_name(name: str) -> bool:
    return name in IGNORE_DIR_NAMES or name.startswith(".DS_Store")

def is_ignored_file(path: Path) -> bool:
    if path_contains_blocked_segment(path):
        return True
    if path.name in EXCLUDE_FILENAMES:
        return True
    for pat in IGNORE_GLOBS:
        if path.match(pat):
            return True
    if path.suffix.lower() in BINARY_EXTS:
        return True
    try:
        if path.stat().st_size > MAX_FILE_SIZE:
            return True
    except OSError:
        return True
    return False

def is_code_like(path: Path) -> bool:
    if path_contains_blocked_segment(path):
        return False
    return (path.suffix.lower() in CODE_EXTS) or (path.name in SPECIAL_FILENAMES)

def read_text(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        try:
            return path.read_text(encoding="latin-1")
        except Exception:
            return None
    except Exception:
        return None

def safe_walk(root: Path) -> Iterable[tuple[str, list[str], list[str]]]:
    """os.walk без захода в игнорируемые каталоги (node_modules, .next, и т.п.)."""
    for dirpath, dirnames, filenames in os.walk(root, followlinks=False):
        # если текущая папка сама внутри запрещённых — пропускаем целиком
        if path_contains_blocked_segment(Path(dirpath)):
            continue
        # вычищаем дочерние папки
        dirnames[:] = [d for d in dirnames if not is_ignored_dir_name(d)]
        yield dirpath, dirnames, filenames

def make_tree_text(root: Path) -> str:
    lines = [f"{root.name}/"]
    entries = []
    for dirpath, dirnames, filenames in safe_walk(root):
        rel_dir = Path(dirpath).relative_to(root)
        for d in dirnames:
            entries.append((rel_dir / d, True))
        for f in filenames:
            fp = Path(dirpath) / f
            if fp.name == ".DS_Store":
                continue
            if is_ignored_file(fp):
                continue
            entries.append((rel_dir / f, False))

    for rel, is_dir in sorted(entries, key=lambda x: str(x[0])):
        parts = rel.parts
        indent = "    " * (len(parts) - 1)
        name = parts[-1] + ("/" if is_dir else "")
        lines.append(f"{indent}└── {name}")
    return "\n".join(lines) + "\n"

def walk_all_files(root: Path) -> Iterable[Path]:
    for dirpath, dirnames, filenames in safe_walk(root):
        for f in filenames:
            p = Path(dirpath) / f
            if p.name == ".DS_Store":
                continue
            if is_ignored_file(p):
                continue
            yield p

def build_single_snapshot(root: Path) -> str:
    out = []
    # 1) Дерево
    out.append("=== FILE TREE ===\n")
    out.append(make_tree_text(root))
    # 2) Код
    out.append("\n=== CODE SNAPSHOT (libraries/build/lock files excluded) ===\n")
    for p in sorted(walk_all_files(root), key=lambda x: str(x)):
        if not is_code_like(p):
            continue
        text = read_text(p)
        if text is None:
            continue
        rel = p.relative_to(root)
        out.append(f"\n--- BEGIN FILE: {rel} ---\n")
        out.append(text.rstrip() + "\n")
        out.append(f"--- END FILE: {rel} ---\n")
    return "".join(out)

def main():
    script_dir = Path(__file__).resolve().parent
    root = script_dir  # корень — папка скрипта
    snapshot_path = script_dir / SNAPSHOT_NAME

    content = build_single_snapshot(root)
    snapshot_path.write_text(content, encoding="utf-8")
    print(f"✅ Снимок создан: {snapshot_path}")

if __name__ == "__main__":
    main()
