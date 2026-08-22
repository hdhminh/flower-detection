import os
from flask import Flask, render_template_string, request, jsonify

app = Flask(__name__)

DATASET_DIR = r"f:\AI_Model\flower dectection\backend\training\dataset_v7\images\train"

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>AI Visual Review</title>
    <style>
        body { font-family: sans-serif; background: #121212; color: white; }
        .grid { display: flex; flex-wrap: wrap; gap: 10px; }
        .card { border: 1px solid #333; padding: 5px; text-align: center; background: #1e1e1e; }
        .card img { max-width: 200px; max-height: 200px; display: block; margin-bottom: 5px; }
        .card.selected { background: #5a1a1a; border-color: red; }
        button { padding: 15px 30px; font-size: 18px; background: red; color: white; border: none; cursor: pointer; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>AI Visual Review (Select BAD images to delete)</h1>
    <button id="deleteBtn">Delete Selected Images</button>
    <div class="grid">
        {% for img in images %}
        <div class="card" onclick="toggleSelect(this, '{{ img }}')">
            <img src="/image/{{ img }}" />
            <input type="checkbox" value="{{ img }}" />
            <br>
            <small>{{ img }}</small>
        </div>
        {% endfor %}
    </div>
    <script>
        const selected = new Set();
        function toggleSelect(card, img) {
            const cb = card.querySelector('input');
            cb.checked = !cb.checked;
            if (cb.checked) {
                selected.add(img);
                card.classList.add('selected');
            } else {
                selected.delete(img);
                card.classList.remove('selected');
            }
        }
        
        document.getElementById('deleteBtn').onclick = async () => {
            if (selected.size === 0) { alert('No images selected!'); return; }
            const res = await fetch('/delete', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({images: Array.from(selected)})
            });
            if (res.ok) {
                alert('Deleted successfully!');
                window.location.reload();
            }
        };
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    if not os.path.exists(DATASET_DIR):
        return "Dataset dir not found"
    images = [f for f in os.listdir(DATASET_DIR) if f.endswith('.jpg')]
    return render_template_string(HTML_TEMPLATE, images=images)

@app.route('/image/<filename>')
def serve_image(filename):
    from flask import send_from_directory
    return send_from_directory(DATASET_DIR, filename)

@app.route('/delete', methods=['POST'])
def delete_images():
    data = request.json
    deleted = 0
    for img in data.get('images', []):
        img_path = os.path.join(DATASET_DIR, img)
        txt_path = img_path.replace('images', 'labels').replace('.jpg', '.txt')
        if os.path.exists(img_path):
            os.remove(img_path)
            deleted += 1
        if os.path.exists(txt_path):
            os.remove(txt_path)
    return jsonify({"success": True, "deleted": deleted})

if __name__ == '__main__':
    app.run(port=5000)
