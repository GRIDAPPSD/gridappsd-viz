FROM node:14.17-buster-slim

ARG TIMESTAMP
ARG VERSION

WORKDIR /gridappsd

COPY . /gridappsd/viz/

WORKDIR /gridappsd/viz/client
RUN npm install \
    && npm run build version=$VERSION

WORKDIR /gridappsd/viz/server
RUN npm install \
    && npm run build

RUN echo $TIMESTAMP > /gridappsd/viz/dockerbuildversion.txt

ENV VIZ_PORT=8082
ENV PORT=${VIZ_PORT}
EXPOSE ${VIZ_PORT}

USER node

CMD ["npm", "start"]
