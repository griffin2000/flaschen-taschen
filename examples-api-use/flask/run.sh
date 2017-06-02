FLASK_ROOT="${FLASK_ROOT:-~/github/flaschen-taschen/examples-api-use/flask}"
export FLASK_APP=ftflask
export FT_HOST=ft.noise
export PYTHONPATH="../../api/python"
echo $PYTHONPATH
python -m flask run --port=80 --host=0.0.0.0
