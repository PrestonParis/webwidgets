"""Deterministic creative canvas layer analyzer."""


def _contrast_ratio(color1: str, color2: str) -> float:
    """Approximate contrast ratio from hex colors. Returns a value 1-21."""
    def luminance(hex_color: str) -> float:
        hex_color = hex_color.lstrip("#")
        if len(hex_color) != 6:
            return 0.5
        r, g, b = (int(hex_color[i:i+2], 16) / 255 for i in (0, 2, 4))
        def linearize(c: float) -> float:
            return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
        R, G, B = linearize(r), linearize(g), linearize(b)
        return 0.2126 * R + 0.7152 * G + 0.0722 * B
    l1 = luminance(color1)
    l2 = luminance(color2)
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


def _is_off_canvas(layer: dict, canvas_w: float, canvas_h: float) -> bool:
    x, y = layer.get("x", 0), layer.get("y", 0)
    w, h = layer.get("width", 0), layer.get("height", 0)
    return x + w < 0 or y + h < 0 or x > canvas_w or y > canvas_h


def _overlaps(a: dict, b: dict) -> bool:
    ax, ay, aw, ah = a.get("x", 0), a.get("y", 0), a.get("width", 0), a.get("height", 0)
    bx, by, bw, bh = b.get("x", 0), b.get("y", 0), b.get("width", 0), b.get("height", 0)
    return ax < bx + bw and ax + aw > bx and ay < by + bh and ay + ah > by


def analyze(layers: list[dict], canvas_width: float = 1920, canvas_height: float = 1080) -> dict:
    """
    Analyze canvas layers for export readiness and issues.
    Layer fields: {id, name, type, visible, locked, x, y, width, height, fill_color, text_color, content}
    Returns: {issues, recommended_format, ready, export_blocked_count}
    """
    issues = []
    visible = [l for l in layers if l.get("visible", True)]

    for layer in visible:
        if _is_off_canvas(layer, canvas_width, canvas_height):
            issues.append({"layer_id": layer.get("id", ""), "type": "off_canvas",
                           "severity": "warning", "message": f"Layer '{layer.get('name','')}' extends outside canvas bounds."})

    text_layers = [l for l in visible if l.get("type") == "text"]
    for tl in text_layers:
        tc = tl.get("text_color", "#000000")
        fc = tl.get("fill_color", "#ffffff")
        if tc and fc:
            try:
                ratio = _contrast_ratio(tc, fc)
                if ratio < 4.5:
                    issues.append({"layer_id": tl.get("id", ""), "type": "low_contrast",
                                   "severity": "warning", "message": f"Text layer '{tl.get('name','')}' contrast {ratio:.1f}:1 below WCAG AA (4.5:1)."})
            except Exception:
                pass

    for i, a in enumerate(visible):
        for b in visible[i + 1:]:
            if a.get("type") == "text" and b.get("type") == "text" and _overlaps(a, b):
                issues.append({"layer_id": a.get("id", ""), "type": "overlap",
                               "severity": "info", "message": f"Text layers '{a.get('name','')}' and '{b.get('name','')}' overlap."})
                break

    has_text = any(l.get("type") == "text" for l in visible)
    has_vector = any(l.get("type") in ("shape", "vector", "path") for l in visible)
    has_raster = any(l.get("type") in ("image", "raster") for l in visible)

    if has_vector and not has_raster:
        recommended_format = "svg"
    elif has_text and not has_raster:
        recommended_format = "pdf"
    else:
        recommended_format = "png"

    off_canvas_count = sum(1 for iss in issues if iss["type"] == "off_canvas")
    ready = len(visible) > 0 and off_canvas_count == 0

    return {
        "issues": issues,
        "recommended_format": recommended_format,
        "ready": ready,
        "visible_layer_count": len(visible),
        "total_layer_count": len(layers),
        "export_blocked_count": off_canvas_count,
    }
