from pathlib import Path
import filecmp
import shutil
import subprocess
import sys
import tempfile


ROOT = Path(__file__).resolve().parents[1]

GENERATED_GLOBS = (
    "*.html",
    "lp/*.html",
    "database/*.html",
)

GENERATED_FILES = (
    "assets/js/tfse-categories.js",
    "assets/js/tfse-products.js",
    "assets/js/tfse-landing-pages.js",
    "assets/js/tfse-articles.js",
    ".well-known/security.txt",
    "feed.xml",
    "robots.txt",
    "sitemap.xml",
)


def ignore_tree(directory, names):
    return {name for name in names if name in {".git", "__pycache__", "node_modules", ".DS_Store"}}


def generated_paths(root):
    paths = []
    for pattern in GENERATED_GLOBS:
        paths.extend(sorted(root.glob(pattern)))
    for name in GENERATED_FILES:
        paths.append(root / name)
    return sorted({path.relative_to(root).as_posix() for path in paths if path.exists()})


def main():
    with tempfile.TemporaryDirectory(prefix="tfse-seo-audit-") as temp_dir:
        temp_root = Path(temp_dir) / "site"
        shutil.copytree(ROOT, temp_root, ignore=ignore_tree)
        result = subprocess.run(
            [sys.executable, "tools/generate_seo_assets.py"],
            cwd=temp_root,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        if result.returncode:
            print(result.stdout, end="")
            print(result.stderr, end="")
            return result.returncode

        failures = []
        current = set(generated_paths(ROOT))
        regenerated = set(generated_paths(temp_root))
        for name in sorted(current ^ regenerated):
            failures.append(f"generated asset set mismatch: {name}")
        for name in sorted(current & regenerated):
            if not filecmp.cmp(ROOT / name, temp_root / name, shallow=False):
                failures.append(f"{name}: not in sync with tools/generate_seo_assets.py")

        if failures:
            for failure in failures:
                print(failure)
            print("Run python3 tools/generate_seo_assets.py, then rerun validation.")
            return 1

    print("SEO assets audit passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
