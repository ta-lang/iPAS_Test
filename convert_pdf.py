import os
import re
import subprocess
import sys
import markdown

# Dynamically resolve workspace and temp directories relative to script location
workspace_dir = os.path.dirname(os.path.abspath(__file__))
temp_dir = os.path.join(workspace_dir, ".temp")
os.makedirs(temp_dir, exist_ok=True)

css_styles = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap');

@page {
    size: A4;
    margin: 2cm;
}

body {
    font-family: 'Inter', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
    color: #2d3748;
    line-height: 1.7;
    background-color: #fff;
    margin: 0;
    padding: 0;
}

h1, h2, h3, h4, h5, h6 {
    color: #1a202c;
    font-weight: 700;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    page-break-after: avoid;
}

h1 {
    font-size: 28px;
    border-bottom: 3px solid #4c51bf;
    padding-bottom: 8px;
    margin-top: 0;
}

h2 {
    font-size: 22px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 6px;
    color: #4c51bf;
    margin-top: 1.8em;
}

h3 {
    font-size: 18px;
    color: #2b6cb0;
}

p, li {
    font-size: 15px;
    text-align: justify;
}

ul, ol {
    padding-left: 20px;
}

li {
    margin-bottom: 8px;
}

/* Zebra tables */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 25px 0;
    font-size: 14.5px;
    page-break-inside: avoid;
}

th, td {
    border: 1px solid #cbd5e0;
    padding: 12px 14px;
    text-align: left;
    vertical-align: top;
}

th {
    background-color: #ebf8ff;
    color: #2b6cb0;
    font-weight: 700;
    border-bottom: 2px solid #bee3f8;
}

tr:nth-child(even) {
    background-color: #f7fafc;
}

/* Flowchart styling for Mermaid replacement */
.flowchart {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 30px 0;
    gap: 8px;
}

.flowchart-node {
    background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%);
    border: 1px solid #90cdf4;
    border-radius: 8px;
    padding: 14px 28px;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    width: 340px;
    page-break-inside: avoid;
}

.flowchart-node h3 {
    margin: 0 0 6px 0;
    font-size: 16px;
    color: #2b6cb0;
    font-weight: 700;
}

.flowchart-node p {
    margin: 0;
    font-size: 13px;
    color: #4a5568;
    text-align: center;
}

.flowchart-arrow {
    font-size: 16px;
    color: #4a5568;
    font-weight: bold;
    margin: 4px 0;
}

/* Callouts/Alert boxes */
.alert {
    border-left: 5px solid;
    padding: 16px;
    margin: 24px 0;
    border-radius: 4px;
    page-break-inside: avoid;
}

.alert-note {
    background-color: #ebf8ff;
    border-color: #3182ce;
    color: #2b6cb0;
}

.alert-important {
    background-color: #fed7d7;
    border-color: #e53e3e;
    color: #9b2c2c;
}

.alert-warning {
    background-color: #feebc8;
    border-color: #dd6b20;
    color: #9c4221;
}

.alert-caution {
    background-color: #faf5ff;
    border-color: #805ad5;
    color: #553c9a;
}

.alert-title {
    font-weight: 700;
    margin-bottom: 6px;
    font-size: 15px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.alert p {
    margin: 0;
}

/* Horizontal rule styling */
hr {
    border: 0;
    height: 1px;
    background-color: #e2e8f0;
    margin: 35px 0;
}

strong {
    font-weight: 700;
    color: #1a202c;
}

code {
    font-family: Consolas, Monaco, monospace;
    background-color: #edf2f7;
    padding: 2px 5px;
    border-radius: 3px;
    font-size: 14px;
}

blockquote {
    margin: 20px 0;
    padding-left: 15px;
    border-left: 4px solid #cbd5e0;
    color: #4a5568;
    font-style: italic;
}
"""

def parse_markdown_to_html(md_content):
    # 1. Stateful parser to find alert blockquotes and replace them with placeholders
    lines = md_content.splitlines()
    processed_lines = []
    in_blockquote = False
    bq_indent = ""
    bq_list_marker = ""
    bq_type = ""
    bq_lines = []
    alert_blocks = []
    
    alert_types = {
        "NOTE": ("note", "💡 提示"),
        "IMPORTANT": ("important", "📌 重要重點"),
        "WARNING": ("warning", "⚠️ 出題盲點"),
        "CAUTION": ("caution", "⚡ 核心考點")
    }

    i = 0
    while i < len(lines):
        line = lines[i]
        match = re.match(r'^(\s*)([*\-+]\s+)?>\s*(.*)$', line)
        if match:
            indent = match.group(1)
            list_marker = match.group(2) if match.group(2) else ""
            content = match.group(3)
            
            alert_match = re.match(r'^\[!(NOTE|IMPORTANT|WARNING|CAUTION)\](.*)$', content.strip())
            if alert_match and not in_blockquote:
                in_blockquote = True
                bq_indent = indent
                bq_list_marker = list_marker
                bq_type = alert_match.group(1)
                extra = alert_match.group(2).strip()
                if extra:
                    bq_lines.append(extra)
            elif in_blockquote:
                bq_lines.append(content)
            else:
                processed_lines.append(line)
        else:
            if in_blockquote:
                placeholder = f"<!-- ALERT_PLACEHOLDER_{len(alert_blocks)} -->"
                if bq_list_marker:
                    processed_lines.append(f"{bq_indent}{bq_list_marker}{placeholder}")
                else:
                    processed_lines.append(f"{bq_indent}{placeholder}")
                
                inner_md = "\n".join(bq_lines)
                inner_html = markdown.markdown(inner_md, extensions=['tables', 'fenced_code'])
                
                alert_class, alert_title = alert_types[bq_type]
                alert_html = (
                    f"<div class=\"alert alert-{alert_class}\">\n"
                    f"  <div class=\"alert-title\">{alert_title}</div>\n"
                    f"  {inner_html}\n"
                    f"</div>"
                )
                alert_blocks.append(alert_html)
                
                in_blockquote = False
                bq_lines = []
                
            processed_lines.append(line)
        i += 1
        
    if in_blockquote:
        placeholder = f"<!-- ALERT_PLACEHOLDER_{len(alert_blocks)} -->"
        if bq_list_marker:
            processed_lines.append(f"{bq_indent}{bq_list_marker}{placeholder}")
        else:
            processed_lines.append(f"{bq_indent}{placeholder}")
            
        inner_md = "\n".join(bq_lines)
        inner_html = markdown.markdown(inner_md, extensions=['tables', 'fenced_code'])
        
        alert_class, alert_title = alert_types[bq_type]
        alert_html = (
            f"<div class=\"alert alert-{alert_class}\">\n"
            f"  <div class=\"alert-title\">{alert_title}</div>\n"
            f"  {inner_html}\n"
            f"</div>"
        )
        alert_blocks.append(alert_html)

    preprocessed_md = '\n'.join(processed_lines)

    # 2. Custom replacement for the Unit A Mermaid diagram
    mermaid_pattern = r"```mermaid\s*graph TD\s*Data\[資料層 Data Layer<br>原始資料來源/資料庫\] -->\|擷取資料\| Integration\[整合層 Integration Layer<br>資料倉儲 Data Warehouse\]\s*Integration -->\|編譯分析\| Analysis\[分析層 Analytical Layer<br>分析引擎/報表製作\]\s*```"
    
    flowchart_html = """
<div class="flowchart">
  <div class="flowchart-node">
    <h3>資料層 Data Layer</h3>
    <p>原始資料來源/資料庫</p>
  </div>
  <div class="flowchart-arrow">⬇ 擷取資料</div>
  <div class="flowchart-node">
    <h3>整合層 Integration Layer</h3>
    <p>資料倉儲 Data Warehouse</p>
  </div>
  <div class="flowchart-arrow">⬇ 編譯分析</div>
  <div class="flowchart-node">
    <h3>分析層 Analytical Layer</h3>
    <p>分析引擎/報表製作</p>
  </div>
</div>
"""
    preprocessed_md = re.sub(mermaid_pattern, flowchart_html, preprocessed_md, flags=re.DOTALL)

    # 3. Simple math replacements for Chebyshev's Theorem in Unit B
    preprocessed_md = preprocessed_md.replace("$1 - 1/k^2$", "1 - 1/k<sup>2</sup>")
    preprocessed_md = preprocessed_md.replace("$k > 1$", "k > 1")
    preprocessed_md = preprocessed_md.replace("$k = 2$", "k = 2")
    preprocessed_md = preprocessed_md.replace("$1 - 1/2^2 = 3/4$", "1 - 1/2<sup>2</sup> = 3/4")

    # 4. Insert blank line before lists if they are adjacent to a paragraph
    lines = preprocessed_md.splitlines()
    new_lines = []
    for i, line in enumerate(lines):
        is_list = re.match(r'^\s*([*\-+]|\d+\.)\s+', line)
        if is_list and i > 0:
            prev_line = new_lines[-1]
            if prev_line.strip() and not re.match(r'^\s*([*\-+]|\d+\.)\s+', prev_line) and not prev_line.strip().startswith('#') and not prev_line.strip().startswith('---'):
                new_lines.append('')
        new_lines.append(line)
    preprocessed_md = '\n'.join(new_lines)

    # Convert markdown to HTML
    html_body = markdown.markdown(preprocessed_md, extensions=['tables', 'fenced_code'])

    # 5. Replace placeholders with actual alert HTML blocks
    for idx, alert_html in enumerate(alert_blocks):
        placeholder = f"<!-- ALERT_PLACEHOLDER_{idx} -->"
        p_placeholder = f"<p>{placeholder}</p>"
        if p_placeholder in html_body:
            html_body = html_body.replace(p_placeholder, alert_html)
        else:
            html_body = html_body.replace(placeholder, alert_html)

    # Wrap in full HTML template
    full_html = f"""<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <title>Study Notes</title>
    <style>
        {css_styles}
    </style>
</head>
<body>
    <div style="max-width: 800px; margin: 0 auto; padding: 20px 0;">
        {html_body}
    </div>
</body>
</html>
"""
    return full_html

def convert_md_to_pdf(md_filename, pdf_filename):
    md_path = os.path.join(workspace_dir, md_filename)
    temp_html_path = os.path.join(temp_dir, md_filename.replace(".md", ".html"))
    pdf_path = os.path.join(workspace_dir, pdf_filename)
    
    # Ensure intermediate subdirectories inside .temp exist
    os.makedirs(os.path.dirname(temp_html_path), exist_ok=True)

    sys.stdout.buffer.write(f"Reading {md_filename}...\n".encode("utf-8"))
    sys.stdout.flush()
    
    with open(md_path, "r", encoding="utf-8") as f:
        md_content = f.read()

    sys.stdout.buffer.write(f"Converting {md_filename} to HTML...\n".encode("utf-8"))
    sys.stdout.flush()
    html_content = parse_markdown_to_html(md_content)

    sys.stdout.buffer.write(f"Writing HTML to {temp_html_path}...\n".encode("utf-8"))
    sys.stdout.flush()
    with open(temp_html_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    sys.stdout.buffer.write(f"Invoking MS Edge to print {temp_html_path} to {pdf_path}...\n".encode("utf-8"))
    sys.stdout.flush()
    
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    
    cmd = [
        edge_path,
        "--headless",
        "--disable-gpu",
        "--no-header-footer",
        f"--print-to-pdf={pdf_path}",
        temp_html_path
    ]
    
    result = subprocess.run(cmd, capture_output=True)
    if result.returncode == 0:
        sys.stdout.buffer.write(f"Successfully generated PDF: {pdf_path}\n".encode("utf-8"))
    else:
        sys.stdout.buffer.write(f"Failed to generate PDF. Return code: {result.returncode}\n".encode("utf-8"))
        sys.stdout.buffer.write(b"Stderr: " + result.stderr + b"\n")
    sys.stdout.flush()

if __name__ == "__main__":
    files_to_convert = [
        # 營運智慧分析師 筆記
        ("營運智慧分析師/單元A_企業資訊系統與大腦.md", "營運智慧分析師/單元A_企業資訊系統與大腦.pdf"),
        ("營運智慧分析師/單元B_資料分析與機器學習.md", "營運智慧分析師/單元B_資料分析與機器學習.pdf"),
        ("營運智慧分析師/單元C_經營管理與專案規劃.md", "營運智慧分析師/單元C_經營管理與專案規劃.pdf"),
        # AI 應用規劃師 筆記
        ("AI應用規劃師/初級單元一_AI基礎理論與機器學習.md", "AI應用規劃師/初級單元一_AI基礎理論與機器學習.pdf"),
        ("AI應用規劃師/初級單元二_生成式AI與無程式碼應用.md", "AI應用規劃師/初級單元二_生成式AI與無程式碼應用.pdf")
    ]
    
    for md_file, pdf_file in files_to_convert:
        convert_md_to_pdf(md_file, pdf_file)
        sys.stdout.buffer.write(b"-" * 50 + b"\n")
        sys.stdout.flush()
