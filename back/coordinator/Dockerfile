# This Dockerfile assumes the build context to be one level above its
# location, for package discovery purposes
#
FROM python:3.12-alpine

RUN pip install poetry==2.1.1

# Disable all interactivity with the poetry program
ENV POETRY_NO_INTERACTION=1

WORKDIR /usr/local/app

# Copy the entire backend subtree into the image
COPY . ./

# Install the dependencies of the package coordinator
RUN poetry -P coordinator/ install

EXPOSE 8000

# Run using FastAPI
CMD ["poetry", "-P", "coordinator/", "run", "fastapi", "run", "coordinator/src/coordinator/main.py"]
