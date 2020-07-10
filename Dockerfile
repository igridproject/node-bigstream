FROM node:lts-alpine

RUN apk add --no-cache make gcc g++ python linux-headers udev

COPY . /app/node-bigstream

WORKDIR /app/node-bigstream

RUN npm install

FROM node:lts-alpine

COPY --from=0 /app/node-bigstream /app/node-bigstream

RUN npm install -y pm2@latest -g

RUN mkdir -p /var/bigstream/data

EXPOSE 19980 19080 19180

# start server
WORKDIR /app/node-bigstream
CMD ["pm2-runtime", "start", "pm2-default.json"]