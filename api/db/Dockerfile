# Check out https://hub.docker.com/_/mongo to select a new base image
FROM mongo

ENV db_dump "dump.agz"

# # Create app directory
RUN mkdir -p /home/mongo/db
WORKDIR /home/mongo/db

COPY . .

CMD mongorestore --gzip --archive=${db_dump} --host=mongo --db marketplace
