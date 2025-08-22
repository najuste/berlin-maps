from flask import Blueprint, jsonify, render_template
from app.service import fetch_solar_data

bp = Blueprint("main", __name__)


@bp.route("/")
def index():
    return render_template("index.html")


@bp.route("/api/data")
def get_data():
    data = fetch_solar_data()
    if data:
        return jsonify(data)
    return jsonify({"error": "Failed to load data"}), 500
