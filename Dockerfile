FROM node:10.17.0-buster-slim

ARG TIMESTAMP
ARG VERSION

WORKDIR /gridappsd

COPY . /gridappsd/viz/

WORKDIR /gridappsd/viz/frontend
RUN npm install \
    && npm run build --env buildVersion=$VERSION

WORKDIR /gridappsd/viz/backend
RUN npm install \
    && npm run build

RUN echo $TIMESTAMP > /gridappsd/viz/dockerbuildversion.txt

ENV VIZ_PORT=8082
ENV PORT=${VIZ_PORT}
EXPOSE ${VIZ_PORT}

USER node

CMD ["npm", "start"]
