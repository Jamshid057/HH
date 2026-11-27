run:
	uv run manage.py runserver

front:
	cd frontend && npm run dev

seed:
	uv run manage.py seed_demo
