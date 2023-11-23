- Init docker image

  `docker build . -t gasbot`

- Create Json files
    - config.json
    - autopost.json



- Run program

  `docker run --rm  --name "gas_bot" -v "$(pwd):/src" gasbot:latest`
  `docker run -it  --rm --name "gas_bot" gasbot:latest /bin/bash`