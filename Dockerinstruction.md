- Init docker image

  `docker build . -t gasbot`

- Create Json files
    - config.json
    - autopost.json



- Run program

  `docker run --rm  --restart always --name "gas_bot" -v "$(pwd):/usr/src/app" gasbot:latest`
  `docker run -it  --rm --name "gas_bot" gasbot:latest /bin/bash`