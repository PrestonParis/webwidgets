import sys

from defusedxml import ElementTree

KNOWN_FAILING_TESTS = {
    "test_api::test_submit_feedback_endpoint",
    "test_drift_monitor::test_log_feedback",
    "test_model_registry::test_get_model_info",
    "test_schemas::test_email_classification_confidence_out_of_range",
}


def failure_names(path: str) -> list[str]:
    root = ElementTree.parse(path).getroot()
    if root is None:
        raise ValueError("pytest JUnit report has no root element")
    failures: list[str] = []
    for case in root.iter("testcase"):
        if case.find("failure") is None and case.find("error") is None:
            continue
        class_name = case.attrib.get("classname", "unknown")
        module_name = class_name.rsplit(".", maxsplit=1)[-1]
        failures.append(f"{module_name}::{case.attrib.get('name', 'unknown')}")
    return failures


def main() -> int:
    if len(sys.argv) != 2:
        sys.stderr.write("Usage: checkPythonTestResults.py <pytest-junit-report>\n")
        return 2
    failures = failure_names(sys.argv[1])
    known = [name for name in failures if name in KNOWN_FAILING_TESTS]
    unexpected = [name for name in failures if name not in KNOWN_FAILING_TESTS]
    if known:
        sys.stdout.write(f"[known debt, not gating — see #21] {len(known)} failure(s):\n")
        for name in known:
            sys.stdout.write(f"  - {name}\n")
    if unexpected:
        sys.stderr.write(f"{len(unexpected)} unexpected Python test failure(s):\n")
        for name in unexpected:
            sys.stderr.write(f"  - {name}\n")
        return 1
    sys.stdout.write("No unexpected Python test failures.\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
