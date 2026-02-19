import uvicorn

from .main import app


def default():
    uvicorn.run(app)


default()
