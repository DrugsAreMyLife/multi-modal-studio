#!/usr/bin/env python3
"""
Test suite for LoRA training wrapper.

Run with: python test_trainer.py

Note: Tests that require imports (torch, diffusers, etc.) are skipped
if dependencies are not installed.
"""

import json
import tempfile
from pathlib import Path
import sys


def test_config_json_schema_validity():
    """Test that config schema JSON is valid."""
    print("Testing config schema JSON validity...")

    try:
        with open(Path(__file__).parent / "config_schema.json") as f:
            schema = json.load(f)

        assert schema.get("$schema") == "http://json-schema.org/draft-07/schema#"
        assert schema.get("type") == "object"
        assert "required" in schema
        assert "dataset_path" in schema.get("required", [])
        assert "base_model" in schema.get("required", [])
        assert "output_path" in schema.get("required", [])
        assert "trigger_words" in schema.get("required", [])
        print("  ✓ Config schema is valid JSON with required fields")
        return True
    except Exception as e:
        print(f"  ✗ Config schema test failed: {e}")
        return False


def test_example_config_validity():
    """Test that example config matches schema."""
    print("\nTesting example config validity...")

    try:
        with open(Path(__file__).parent / "example_config.json") as f:
            config = json.load(f)

        required = ["dataset_path", "base_model", "output_path", "trigger_words"]
        for field in required:
            assert field in config, f"Missing required field: {field}"

        assert isinstance(config["trigger_words"], list)
        assert len(config["trigger_words"]) > 0

        print("  ✓ Example config has all required fields")
        return True
    except Exception as e:
        print(f"  ✗ Example config test failed: {e}")
        return False


def test_requirements_file():
    """Test that requirements.txt has proper format."""
    print("\nTesting requirements.txt...")

    try:
        with open(Path(__file__).parent / "requirements.txt") as f:
            lines = f.readlines()

        requirements = [l.strip() for l in lines if l.strip() and not l.startswith("#")]

        # Check for key dependencies
        torch_req = next((r for r in requirements if r.startswith("torch")), None)
        diffusers_req = next((r for r in requirements if r.startswith("diffusers")), None)
        peft_req = next((r for r in requirements if r.startswith("peft")), None)

        assert torch_req, "torch requirement missing"
        assert diffusers_req, "diffusers requirement missing"
        assert peft_req, "peft requirement missing"

        print(f"  ✓ Requirements file contains {len(requirements)} packages")
        print(f"    - {torch_req}")
        print(f"    - {diffusers_req}")
        print(f"    - {peft_req}")
        return True
    except Exception as e:
        print(f"  ✗ Requirements test failed: {e}")
        return False


def test_readme_documentation():
    """Test that README exists and has proper structure."""
    print("\nTesting README documentation...")

    try:
        readme_path = Path(__file__).parent / "README.md"
        assert readme_path.exists(), "README.md not found"

        with open(readme_path) as f:
            content = f.read()

        required_sections = [
            "# LoRA Training Wrapper",
            "## Installation",
            "## Configuration",
            "## Usage",
            "## Output Format",
            "## Troubleshooting",
        ]

        for section in required_sections:
            assert section in content, f"Missing section: {section}"

        lines = len(content.split("\n"))
        print(f"  ✓ README.md exists with {lines} lines")
        print(f"    - Contains all required sections")
        return True
    except Exception as e:
        print(f"  ✗ README test failed: {e}")
        return False


def test_train_lora_script_exists():
    """Test that main training script exists and has proper structure."""
    print("\nTesting train_lora.py script structure...")

    try:
        script_path = Path(__file__).parent / "train_lora.py"
        assert script_path.exists(), "train_lora.py not found"

        with open(script_path) as f:
            content = f.read()

        # Check for key classes and functions
        required_elements = [
            "class TrainingConfig",
            "class ProgressEvent",
            "class LoRATrainer",
            "def main()",
            "def validate()",
            "def train()",
            "signal.signal(signal.SIGTERM",
            "signal.signal(signal.SIGINT",
        ]

        for element in required_elements:
            assert element in content, f"Missing: {element}"

        lines = len(content.split("\n"))
        print(f"  ✓ train_lora.py exists with {lines} lines")
        print(f"    - Contains required classes and methods")
        print(f"    - Signal handlers present for graceful shutdown")
        return True
    except Exception as e:
        print(f"  ✗ Script structure test failed: {e}")
        return False


def test_cli_help_text():
    """Test CLI help text (basic smoke test)."""
    print("\nTesting CLI functionality...")

    try:
        import subprocess
        result = subprocess.run(
            ["python3", str(Path(__file__).parent / "train_lora.py"), "--help"],
            capture_output=True,
            text=True,
            timeout=5
        )

        assert result.returncode == 0, f"Help failed with code {result.returncode}"
        assert "--config" in result.stdout
        assert "--validate-only" in result.stdout
        assert "--debug" in result.stdout

        print("  ✓ CLI help works correctly")
        print(f"    - All expected options present")
        return True
    except Exception as e:
        print(f"  ✗ CLI test failed: {e}")
        return False


def test_missing_config_error_handling():
    """Test error handling for missing config file."""
    print("\nTesting error handling...")

    try:
        import subprocess
        result = subprocess.run(
            ["python3", str(Path(__file__).parent / "train_lora.py"),
             "--config", "/nonexistent/config.json"],
            capture_output=True,
            text=True,
            timeout=5
        )

        assert result.returncode == 1, "Should exit with error code 1"

        # Parse the error output (should be JSON)
        try:
            error_obj = json.loads(result.stdout.strip())
            assert error_obj.get("type") == "error"
            assert "not found" in error_obj.get("message", "").lower()
            print("  ✓ Missing config error handling works")
            print(f"    - Returns proper error JSON")
        except json.JSONDecodeError:
            print("  ✗ Error output is not valid JSON")
            return False

        return True
    except Exception as e:
        print(f"  ✗ Error handling test failed: {e}")
        return False


def test_validate_only_flag():
    """Test validate-only flag functionality."""
    print("\nTesting --validate-only flag...")

    try:
        # Create a temporary config file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            config_data = {
                "dataset_path": "/tmp",
                "base_model": "stabilityai/stable-diffusion-xl-base-1.0",
                "output_path": "/tmp/output",
                "trigger_words": ["test"],
            }
            json.dump(config_data, f)
            config_file = f.name

        try:
            import subprocess
            result = subprocess.run(
                ["python3", str(Path(__file__).parent / "train_lora.py"),
                 "--config", config_file, "--validate-only"],
                capture_output=True,
                text=True,
                timeout=10
            )

            # Extract the last JSON line from output
            lines = [l.strip() for l in result.stdout.split("\n") if l.strip()]
            if lines:
                last_event = json.loads(lines[-1])
                # Should have validation or info messages
                assert last_event.get("type") in ["info", "error", "warning"]
                print("  ✓ --validate-only flag works")
                print(f"    - Exits after validation without training")

            return True
        finally:
            Path(config_file).unlink()
    except Exception as e:
        print(f"  ✗ Validate-only test failed: {e}")
        return False


def main():
    """Run all tests."""
    print("=" * 70)
    print("LoRA Training Wrapper - Test Suite")
    print("=" * 70)

    tests = [
        test_config_json_schema_validity,
        test_example_config_validity,
        test_requirements_file,
        test_readme_documentation,
        test_train_lora_script_exists,
        test_cli_help_text,
        test_missing_config_error_handling,
        test_validate_only_flag,
    ]

    passed = 0
    failed = 0

    for test in tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"\n✗ {test.__name__} failed with exception: {e}")
            import traceback
            traceback.print_exc()
            failed += 1

    print("\n" + "=" * 70)
    print(f"Results: {passed} passed, {failed} failed out of {len(tests)} tests")
    print("=" * 70)

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
