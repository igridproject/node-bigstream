FROM node:12-alpine

RUN apk add make gcc g++ linux-headers udev

COPY . /app/node-bigstream

WORKDIR /app/node-bigstream

RUN npm install
RUN node script/install_plugins.js

FROM node:12-alpine
RUN apk add --no-cache python3
RUN apk add --no-cache tzdata

COPY --from=0 /app/node-bigstream /app/node-bigstream

RUN npm install -y pm2@latest -g

RUN mkdir -p /var/bigstream/data

EXPOSE 19980 19080 19180

# start server
WORKDIR /app/node-bigstream
CMD pm2-runtime pm2.config.js