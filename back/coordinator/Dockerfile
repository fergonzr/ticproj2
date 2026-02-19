# This Dockerfile assumes the build context to be one level above its
# location, for package discovery purposes
#
FROM python:3.12-alpine

RUN pip install poetry==2.1.1

ENV POETRY_NO_INTERACTION=1

WORKDIR /usr/local/app
COPY . ./

RUN poetry -P coordinator/ install && rm -rf $POETRY_CACHE_DIR

EXPOSE 8000

CMD ["poetry", "-P", "coordinator/", "run", "fastapi", "run", "coordinator/src/coordinator/main.py"]
