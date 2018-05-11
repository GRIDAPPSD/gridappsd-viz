FROM node:boron

ARG TIMESTAMP

WORKDIR /gridappsd

RUN npm install -g typescript typings webpack@3.10.0

COPY . /gridappsd/viz/

WORKDIR /gridappsd/viz

RUN npm install  \
    && webpack
    && npm run webpack

RUN echo $TIMESTAMP > /gridappsd/viz/dockerbuildversion.txt

ENV VIZ_PORT=8082 
ENV PORT=${VIZ_PORT}
EXPOSE ${VIZ_PORT}

CMD ["npm", "start"]

