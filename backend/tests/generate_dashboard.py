#!/usr/bin/env python3
"""
generate_dashboard.py
---------------------
Reads a pytest JSON report and produces a self-contained HTML test dashboard.

Usage:
    pytest --tb=short -q --json-report --json-report-file=test_report.json
    python tests/generate_dashboard.py test_report.json dashboard.html
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def _status_badge(status: str) -> str:
    colors = {
        "passed": "#22c55e",
        "failed": "#ef4444",
        "error": "#f97316",
        "skipped": "#eab308",
        "xfailed": "#a78bfa",
        "xpassed": "#06b6d4",
    }
    bg = colors.get(status, "#6b7280")
    return f'<span class="badge" style="background:{bg}">{status.upper()}</span>'


def _duration_fmt(seconds: float) -> str:
    if seconds < 0.001:
        return "&lt;1ms"
    if seconds < 1:
        return f"{seconds * 1000:.0f}ms"
    return f"{seconds:.2f}s"


def generate_html(report: dict) -> str:
    tests = report.get("tests", [])
    summary = report.get("summary", {})
    env = report.get("environment", {})
    created = report.get("created", 0)

    total = summary.get("total", len(tests))
    passed = summary.get("passed", 0)
    failed = summary.get("failed", 0)
    error = summary.get("error", 0)
    skipped = summary.get("skipped", 0)
    duration = summary.get("duration", 0)
    pass_rate = (passed / total * 100) if total else 0

    ts = datetime.fromtimestamp(created, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC") if created else "N/A"

    # Group tests by module
    modules: dict[str, list] = {}
    for t in tests:
        nodeid = t.get("nodeid", "")
        module = nodeid.split("::")[0] if "::" in nodeid else nodeid
        modules.setdefault(module, []).append(t)

    # Build module rows
    module_rows = ""
    for module, mod_tests in sorted(modules.items()):
        mod_passed = sum(1 for t in mod_tests if t.get("outcome") == "passed")
        mod_failed = sum(1 for t in mod_tests if t.get("outcome") in ("failed", "error"))
        mod_skipped = sum(1 for t in mod_tests if t.get("outcome") == "skipped")
        mod_duration = sum(t.get("duration", 0) for t in mod_tests)
        mod_status = "passed" if mod_failed == 0 else "failed"

        test_rows = ""
        for t in mod_tests:
            outcome = t.get("outcome", "unknown")
            nodeid = t.get("nodeid", "")
            test_name = nodeid.split("::")[-1] if "::" in nodeid else nodeid
            test_class = nodeid.split("::")[-2] if nodeid.count("::") >= 2 else ""
            dur = t.get("duration", 0)

            # Failure details
            failure_html = ""
            call = t.get("call", {})
            if call and call.get("longrepr"):
                longrepr = call["longrepr"].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                failure_html = f'<pre class="failure-details">{longrepr}</pre>'

            test_rows += f"""
            <tr class="test-row {outcome}">
                <td class="test-name">
                    <span class="test-class">{test_class}</span>
                    <span>{test_name}</span>
                </td>
                <td class="test-status">{_status_badge(outcome)}</td>
                <td class="test-duration">{_duration_fmt(dur)}</td>
            </tr>
            """
            if failure_html:
                test_rows += f"""
            <tr class="failure-row">
                <td colspan="3">{failure_html}</td>
            </tr>"""

        module_rows += f"""
        <div class="module-card">
            <div class="module-header" onclick="this.parentElement.classList.toggle('collapsed')">
                <div class="module-title">
                    {_status_badge(mod_status)}
                    <span class="module-name">{module}</span>
                </div>
                <div class="module-stats">
                    <span class="stat-passed">{mod_passed} passed</span>
                    {f'<span class="stat-failed">{mod_failed} failed</span>' if mod_failed else ''}
                    {f'<span class="stat-skipped">{mod_skipped} skipped</span>' if mod_skipped else ''}
                    <span class="stat-duration">{_duration_fmt(mod_duration)}</span>
                    <span class="chevron">&#9660;</span>
                </div>
            </div>
            <table class="test-table">
                <tbody>{test_rows}</tbody>
            </table>
        </div>"""

    # Donut chart (SVG)
    svg_chart = _donut_chart(passed, failed + error, skipped)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dspire VR Zone – Test Dashboard</title>
<style>
:root {{
    --bg: #0f172a;
    --surface: #1e293b;
    --surface2: #334155;
    --text: #e2e8f0;
    --text-dim: #94a3b8;
    --accent: #818cf8;
    --green: #22c55e;
    --red: #ef4444;
    --yellow: #eab308;
    --orange: #f97316;
    --border: #475569;
}}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    padding: 2rem;
}}
.dashboard {{ max-width: 1200px; margin: 0 auto; }}
.header {{
    text-align: center;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--border);
}}
.header h1 {{
    font-size: 2rem;
    color: var(--accent);
    margin-bottom: 0.25rem;
}}
.header .subtitle {{
    color: var(--text-dim);
    font-size: 0.9rem;
}}
.summary-grid {{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}}
.summary-card {{
    background: var(--surface);
    border-radius: 12px;
    padding: 1.25rem;
    text-align: center;
    border: 1px solid var(--border);
}}
.summary-card .value {{
    font-size: 2rem;
    font-weight: 700;
}}
.summary-card .label {{
    font-size: 0.8rem;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}}
.summary-card.passed .value {{ color: var(--green); }}
.summary-card.failed .value {{ color: var(--red); }}
.summary-card.skipped .value {{ color: var(--yellow); }}
.summary-card.rate .value {{ color: var(--accent); }}
.summary-card.time .value {{ color: var(--text); font-size: 1.5rem; }}
.chart-section {{
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
}}
.module-card {{
    background: var(--surface);
    border-radius: 12px;
    margin-bottom: 1rem;
    border: 1px solid var(--border);
    overflow: hidden;
}}
.module-header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    cursor: pointer;
    transition: background 0.2s;
}}
.module-header:hover {{ background: var(--surface2); }}
.module-title {{ display: flex; align-items: center; gap: 0.75rem; }}
.module-name {{ font-weight: 600; font-size: 1rem; }}
.module-stats {{ display: flex; gap: 1rem; align-items: center; font-size: 0.85rem; }}
.stat-passed {{ color: var(--green); }}
.stat-failed {{ color: var(--red); }}
.stat-skipped {{ color: var(--yellow); }}
.stat-duration {{ color: var(--text-dim); }}
.chevron {{
    transition: transform 0.2s;
    color: var(--text-dim);
    font-size: 0.75rem;
}}
.module-card.collapsed .chevron {{ transform: rotate(-90deg); }}
.module-card.collapsed .test-table {{ display: none; }}
.test-table {{
    width: 100%;
    border-collapse: collapse;
}}
.test-row td {{
    padding: 0.6rem 1.25rem;
    border-top: 1px solid var(--border);
    font-size: 0.9rem;
}}
.test-name {{ display: flex; flex-direction: column; }}
.test-class {{ color: var(--text-dim); font-size: 0.75rem; }}
.test-status {{ text-align: center; width: 100px; }}
.test-duration {{ text-align: right; width: 80px; color: var(--text-dim); }}
.badge {{
    display: inline-block;
    padding: 0.15rem 0.6rem;
    border-radius: 9999px;
    font-size: 0.7rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.05em;
}}
.failure-details {{
    background: #1a1a2e;
    color: #fca5a5;
    padding: 0.75rem 1rem;
    font-size: 0.8rem;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
    border-radius: 6px;
    margin: 0.5rem 1rem;
}}
.failure-row td {{
    padding: 0 !important;
    border: none !important;
}}
.footer {{
    text-align: center;
    padding-top: 2rem;
    color: var(--text-dim);
    font-size: 0.8rem;
}}
</style>
</head>
<body>
<div class="dashboard">
    <div class="header">
        <h1>Dspire VR Zone &mdash; Test Dashboard</h1>
        <div class="subtitle">Generated {ts} &bull; pytest {env.get("Python", "")}</div>
    </div>

    <div class="summary-grid">
        <div class="summary-card">
            <div class="value">{total}</div>
            <div class="label">Total Tests</div>
        </div>
        <div class="summary-card passed">
            <div class="value">{passed}</div>
            <div class="label">Passed</div>
        </div>
        <div class="summary-card failed">
            <div class="value">{failed + error}</div>
            <div class="label">Failed</div>
        </div>
        <div class="summary-card skipped">
            <div class="value">{skipped}</div>
            <div class="label">Skipped</div>
        </div>
        <div class="summary-card rate">
            <div class="value">{pass_rate:.1f}%</div>
            <div class="label">Pass Rate</div>
        </div>
        <div class="summary-card time">
            <div class="value">{_duration_fmt(duration)}</div>
            <div class="label">Duration</div>
        </div>
    </div>

    <div class="chart-section">
        {svg_chart}
    </div>

    <h2 style="margin-bottom:1rem; color: var(--text-dim); font-size: 1.1rem;">Test Modules</h2>
    {module_rows}

    <div class="footer">
        Dspire VR Zone Automation Test Suite &bull; Powered by pytest
    </div>
</div>
<script>
// Start all modules expanded
</script>
</body>
</html>"""
    return html


def _donut_chart(passed: int, failed: int, skipped: int) -> str:
    total = passed + failed + skipped
    if total == 0:
        return "<p>No tests run.</p>"

    r = 80
    cx, cy = 100, 100
    stroke_width = 24
    circumference = 2 * 3.14159265 * r

    segments = []
    offset = 0
    for count, color, label in [
        (passed, "#22c55e", "Passed"),
        (failed, "#ef4444", "Failed"),
        (skipped, "#eab308", "Skipped"),
    ]:
        if count == 0:
            continue
        pct = count / total
        dash = circumference * pct
        gap = circumference - dash
        segments.append(
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" '
            f'stroke="{color}" stroke-width="{stroke_width}" '
            f'stroke-dasharray="{dash:.2f} {gap:.2f}" '
            f'stroke-dashoffset="{-offset:.2f}" '
            f'transform="rotate(-90 {cx} {cy})" />'
        )
        offset += dash

    pct_text = f"{passed}/{total}"
    return f"""
    <svg width="200" height="200" viewBox="0 0 200 200">
        <circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#334155" stroke-width="{stroke_width}" />
        {''.join(segments)}
        <text x="{cx}" y="{cy - 8}" text-anchor="middle" fill="#e2e8f0" font-size="28" font-weight="700">{pct_text}</text>
        <text x="{cx}" y="{cy + 14}" text-anchor="middle" fill="#94a3b8" font-size="12">tests passed</text>
    </svg>"""


def main():
    if len(sys.argv) < 3:
        print("Usage: python generate_dashboard.py <report.json> <output.html>")
        sys.exit(1)

    report_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])

    with open(report_path) as f:
        report = json.load(f)

    html = generate_html(report)
    output_path.write_text(html)
    print(f"Dashboard written to {output_path}")


if __name__ == "__main__":
    main()
